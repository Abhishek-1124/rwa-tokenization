// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * Minimal Hedera Token Service (HTS) adapter.
 *
 * Notes:
 * - This is an OPTIONAL Phase 2C module.
 * - To succeed on Hedera, the calling contract typically must be configured as the token treasury
 *   and/or have the appropriate supply keys set at token creation.
 */
interface IAdminHts {
    function isIssuer(address) external view returns (bool);
}

interface IHederaTokenService {
    function mintToken(
        address token,
        uint64 amount,
        bytes[] calldata metadata
    ) external returns (int64 responseCode, uint64 newTotalSupply, int64[] memory serialNumbers);

    function transferToken(
        address token,
        address sender,
        address receiver,
        int64 amount
    ) external returns (int64 responseCode);
}

contract HtsAdapter {
    // Hedera HTS precompile address (EVM)
    address public constant HTS_PRECOMPILE = address(0x167);
    int64 public constant SUCCESS = 22;

    IAdminHts public immutable admin;

    event HtsMinted(address indexed token, uint64 amount, uint64 newTotalSupply);
    event HtsTransferred(address indexed token, address indexed to, uint64 amount);

    error NotIssuer();
    error HtsCallFailed(int64 code);

    constructor(address _admin) {
        require(_admin != address(0), "Invalid admin");
        admin = IAdminHts(_admin);
    }

    modifier onlyIssuer() {
        if (!admin.isIssuer(msg.sender)) revert NotIssuer();
        _;
    }

    /**
     * @dev Mint fungible supply into the token treasury (typically this contract), then transfer to `to`.
     * Requires that this contract is configured appropriately for the token on Hedera.
     */
    function mintAndTransferFungible(address token, address to, uint64 amount) external onlyIssuer {
        (int64 code, uint64 newTotalSupply, ) = IHederaTokenService(HTS_PRECOMPILE).mintToken(token, amount, new bytes[](0));
        if (code != SUCCESS) revert HtsCallFailed(code);

        int64 t = IHederaTokenService(HTS_PRECOMPILE).transferToken(token, address(this), to, int64(uint64(amount)));
        if (t != SUCCESS) revert HtsCallFailed(t);

        emit HtsMinted(token, amount, newTotalSupply);
        emit HtsTransferred(token, to, amount);
    }
}


