 // SPDX-License-Identifier: MIT 
pragma solidity ^0.6.12;

 import "./libraries/Context.sol";
 import "./libraries/Address.sol";


contract CssReferral is Context {
    using Address for address;
    
    mapping(address => address) public referrers; // account_address -> referrer_address
    mapping(address => uint256) public referredCount; // referrer_address -> num_of_referred

    event Referral(address indexed referrer, address indexed farmer);
    event NextOwner(address indexed _owner);
    event NextOwnerApproved(address indexed _owner);
    event AdminStatus(address indexed _admin,bool _status);

    // Standard contract ownership transfer.
    address public owner;
    address private nextOwner;

    mapping(address => bool) public isAdmin;

    constructor () public {
        owner = msg.sender;
    }

    // Standard modifier on methods invokable only by contract owner.
    modifier onlyOwner {
        require(msg.sender == owner, "OnlyOwner methods called by non-owner.");
        _;
    }

    modifier onlyAdmin {
        require(isAdmin[msg.sender], "OnlyAdmin methods called by non-admin.");
        _;
    }

    // Standard contract ownership transfer implementation,
    function approveNextOwner(address _nextOwner) external onlyOwner {
        require(_nextOwner != owner, "Cannot approve current owner.");
 
        nextOwner = _nextOwner;
        emit NextOwner(nextOwner);
    }

    function acceptNextOwner() external {
        require(msg.sender == nextOwner, "Can only accept preapproved new owner.");
        owner = nextOwner;
        emit NextOwnerApproved(nextOwner);
    }

    function setCssReferral(address farmer, address referrer) external onlyAdmin {
        if (referrers[farmer] == address(0) && referrer != address(0)) {
            referrers[farmer] = referrer;
            referredCount[referrer] += 1;
            emit Referral(referrer, farmer);
        }
    }

    function getCssReferral(address farmer) external view returns (address) {
        return referrers[farmer];
    }

    // Set admin status.
    function setAdminStatus(address _admin, bool _status) external onlyOwner {
        require(_admin != address(0), 'Admin: admin address cannot be null');
        isAdmin[_admin] = _status;

        emit AdminStatus(  _admin,  _status);
    }
}
 
