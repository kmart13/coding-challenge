pragma solidity ^0.4.17;

contract PrivateTrust {
  struct Beneficiary {
    string name;
    uint maturityAge;
  }

  address public trustor;
  address public trustee;

  Beneficiary[] private beneficiaries;

  event LogDeposit(uint amount);

  modifier onlyTrustor() { require(msg.sender == trustor); _; }
  modifier onlyTrustee() { require(msg.sender == trustee); _; }

  function PrivateTrust() public { trustor = msg.sender; }

  /// Trustor can assign a trustee at address `_addr`.
  function assignTrustee(address _addr) public onlyTrustor {
    trustee = _addr;
  }

  /** Designate a new beneficiary with their full legal name `_name`,
    * and how old `_age` they are required to be before withdrawing from the trust.
    * If the beneficiary has already been designated, this will update the maturityAge to `_age`.
    */
  function designateBeneficiary(string _name, uint _age) public onlyTrustor {
    var (exists, index) = findBeneficiary(_name);

    if (exists) {
      beneficiaries[index].maturityAge = _age;
    } else {
      beneficiaries.push(Beneficiary(_name, _age));
    }
  }

  /// Trustor can deposit funds to the trust and this event will be logged
  function deposit() public payable onlyTrustor {
    LogDeposit(msg.value);
  }

  function getBalance() public view returns (uint) {
    return this.balance;
  }

  function findBeneficiary(string _name) private view returns (bool, uint) {
    for (uint i = 0; i < beneficiaries.length; i++) {
      if (keccak256(beneficiaries[i].name) == keccak256(_name)) {
        return (true, i);
      }
    }

    return (false, 0);
  }

  function() public { }

  function remove() public onlyTrustor { selfdestruct(trustor); }
}
