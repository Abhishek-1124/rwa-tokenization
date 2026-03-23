// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IAdminIncome {
    function isIssuer(address) external view returns (bool);
    function isManagerForToken(address _manager, uint256 _tokenId) external view returns (bool);
    function owner() external view returns (address);
}

interface IFractionalTokenIncome {
    function totalShares(uint256 assetId) external view returns (uint256);
    function balanceOf(address account, uint256 id) external view returns (uint256);
}

/**
 * @dev Claim-based income distribution for dynamic ERC-1155 holders.
 *
 * - Authorized manager/issuer deposits ETH for a given `assetId`
 * - Holders can claim proportionally to their holdings at deposit time
 * - ERC-1155 token calls `onBalanceChange` on transfers to preserve fairness across trades
 */
contract IncomeDistributor {
    uint256 public constant ACC_PRECISION = 1e18;

    address public immutable token;
    IAdminIncome public immutable admin;

    // assetId => cumulative ETH per share (scaled by ACC_PRECISION)
    mapping(uint256 => uint256) public accIncomePerShare;

    // account => assetId => reward debt (scaled by ACC_PRECISION)
    mapping(address => mapping(uint256 => uint256)) public rewardDebt;

    // account => assetId => pending credits accumulated on transfers
    mapping(address => mapping(uint256 => uint256)) public credits;

    event IncomeDeposited(uint256 indexed assetId, address indexed depositor, uint256 amount, uint256 accIncomePerShare);
    event Claimed(uint256 indexed assetId, address indexed account, uint256 amount);

    error NotAuthorized();
    error InvalidAmount();
    error NoShares();
    error OnlyToken();
    error EthTransferFailed();

    constructor(address _token, address _admin) {
        require(_token != address(0) && _admin != address(0), "Invalid address");
        token = _token;
        admin = IAdminIncome(_admin);
    }

    modifier onlyToken() {
        if (msg.sender != token) revert OnlyToken();
        _;
    }

    function _isAuthorized(address caller, uint256 assetId) internal view returns (bool) {
        if (caller == admin.owner()) return true;
        if (admin.isIssuer(caller)) return true;
        return admin.isManagerForToken(caller, assetId);
    }

    function depositIncome(uint256 assetId) external payable {
        if (msg.value == 0) revert InvalidAmount();
        if (!_isAuthorized(msg.sender, assetId)) revert NotAuthorized();

        uint256 shares = IFractionalTokenIncome(token).totalShares(assetId);
        if (shares == 0) revert NoShares();

        accIncomePerShare[assetId] += (msg.value * ACC_PRECISION) / shares;
        emit IncomeDeposited(assetId, msg.sender, msg.value, accIncomePerShare[assetId]);
    }

    function pending(address account, uint256 assetId) external view returns (uint256) {
        uint256 balanceShares = IFractionalTokenIncome(token).balanceOf(account, assetId);
        uint256 acc = accIncomePerShare[assetId];
        uint256 accumulated = (balanceShares * acc) / ACC_PRECISION;
        uint256 debt = rewardDebt[account][assetId];
        uint256 extra = credits[account][assetId];
        if (accumulated < debt) return extra; // should not happen, but guard
        return extra + (accumulated - debt);
    }

    function claim(uint256 assetId) external {
        uint256 balanceShares = IFractionalTokenIncome(token).balanceOf(msg.sender, assetId);
        uint256 acc = accIncomePerShare[assetId];
        uint256 accumulated = (balanceShares * acc) / ACC_PRECISION;
        uint256 debt = rewardDebt[msg.sender][assetId];

        uint256 amount = credits[msg.sender][assetId];
        if (accumulated > debt) {
            amount += (accumulated - debt);
        }

        // Effects
        credits[msg.sender][assetId] = 0;
        rewardDebt[msg.sender][assetId] = accumulated;

        if (amount == 0) return;

        (bool ok, ) = payable(msg.sender).call{value: amount}("");
        if (!ok) revert EthTransferFailed();
        emit Claimed(assetId, msg.sender, amount);
    }

    /**
     * @dev Called by the ERC-1155 token on every balance change to preserve fairness across trades.
     * All amounts are raw share balances (not scaled).
     */
    function onBalanceChange(
        address from,
        address to,
        uint256 assetId,
        uint256 oldFromBalance,
        uint256 newFromBalance,
        uint256 oldToBalance,
        uint256 newToBalance
    ) external onlyToken {
        uint256 acc = accIncomePerShare[assetId];
        if (acc == 0) {
            // nothing to do yet, but still sync debt to prevent future underflow when acc becomes non-zero
            if (from != address(0)) rewardDebt[from][assetId] = 0;
            if (to != address(0)) rewardDebt[to][assetId] = 0;
            return;
        }

        if (from != address(0)) {
            uint256 oldAccum = (oldFromBalance * acc) / ACC_PRECISION;
            uint256 fromDebt = rewardDebt[from][assetId];
            if (oldAccum > fromDebt) {
                credits[from][assetId] += (oldAccum - fromDebt);
            }
            rewardDebt[from][assetId] = (newFromBalance * acc) / ACC_PRECISION;
        }

        if (to != address(0)) {
            uint256 oldAccumTo = (oldToBalance * acc) / ACC_PRECISION;
            uint256 toDebt = rewardDebt[to][assetId];
            if (oldAccumTo > toDebt) {
                credits[to][assetId] += (oldAccumTo - toDebt);
            }
            rewardDebt[to][assetId] = (newToBalance * acc) / ACC_PRECISION;
        }
    }
}


