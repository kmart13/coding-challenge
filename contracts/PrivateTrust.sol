pragma solidity ^0.4.17;

contract PrivateTrust {
  address public trustor;
  address public trustee;

  modifier onlyTrustor() { require(msg.sender == trustor); _; }
  modifier onlyTrustee() { require(msg.sender == trustee); _; }

  function PrivateTrust() public { trustor = msg.sender; }

  function() public { }

  function remove() public onlyTrustor { selfdestruct(trustor); }
}
