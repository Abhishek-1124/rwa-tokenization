// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Admin {
    address public owner;
    mapping(address => bool) public isIssuer;
    mapping(address => bool) public isManager;
    mapping(address => mapping(uint256 => bool)) public managerForToken;
    bool public marketplacePaused;

    // Events
    event IssuerAdded(address indexed issuer);
    event IssuerRemoved(address indexed issuer);
    event ManagerAdded(address indexed manager);
    event ManagerRemoved(address indexed manager);
    event TokenManagerSet(address indexed manager, uint256 indexed tokenId, bool status);
    event MarketplacePaused(bool paused);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor() {
        owner = msg.sender;
        // Auto-assign owner as issuer and manager
        isIssuer[msg.sender] = true;
        isManager[msg.sender] = true;
        emit IssuerAdded(msg.sender);
        emit ManagerAdded(msg.sender);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not admin");
        _;
    }

    // Issuer Management
    function addIssuer(address _issuer) external onlyOwner {
        require(_issuer != address(0), "Invalid address");
        require(!isIssuer[_issuer], "Already issuer");
        isIssuer[_issuer] = true;
        emit IssuerAdded(_issuer);
    }

    function removeIssuer(address _issuer) external onlyOwner {
        require(_issuer != address(0), "Invalid address");
        require(isIssuer[_issuer], "Not an issuer");
        isIssuer[_issuer] = false;
        emit IssuerRemoved(_issuer);
    }

    // Manager Management
    function addManager(address _manager) external onlyOwner {
        require(_manager != address(0), "Invalid address");
        require(!isManager[_manager], "Already manager");
        isManager[_manager] = true;
        emit ManagerAdded(_manager);
    }

    function removeManager(address _manager) external onlyOwner {
        require(_manager != address(0), "Invalid address");
        require(isManager[_manager], "Not a manager");
        isManager[_manager] = false;
        emit ManagerRemoved(_manager);
    }

    // Token-specific Manager
    function setManagerForToken(address _manager, uint256 _tokenId, bool _status) external onlyOwner {
        require(_manager != address(0), "Invalid address");
        managerForToken[_manager][_tokenId] = _status;
        emit TokenManagerSet(_manager, _tokenId, _status);
    }

    function isManagerForToken(address _manager, uint256 _tokenId) external view returns (bool) {
        return managerForToken[_manager][_tokenId] || isManager[_manager];
    }

    // Marketplace Control
    function pauseMarketplace(bool _pause) external onlyOwner {
        marketplacePaused = _pause;
        emit MarketplacePaused(_pause);
    }

    // Ownership Transfer
    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "Invalid address");
        emit OwnershipTransferred(owner, _newOwner);
        owner = _newOwner;
    }
}
