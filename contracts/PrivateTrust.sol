pragma solidity ^0.4.17;

contract PrivateTrust {
  struct Beneficiary {
    address withdrawalAddress;
    string name;
    uint maturityAge;
    bool hasWithdrawn;
  }

  address constant DEFAULT_ADDRESS = 0x0;

  address public trustor;
  address public trustee;

  Beneficiary[] private beneficiaries;

  event LogDeposit(uint amount);
  event LogDesignation(string name, uint age);
  event LogRemoval(string name);
  event LogWithdrawalAddress(address addr, string name);

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
      beneficiaries.push(Beneficiary(DEFAULT_ADDRESS, _name, _age, false));
    }

    LogDesignation(_name, _age);
  }

  /// Remove a beneficiary from the trust matching the full legal name `_name`
  function removeBeneficiary(string _name) public onlyTrustee {
    var (exists, index) = findBeneficiary(_name);

    require(exists);

    beneficiaries[index] = beneficiaries[beneficiaries.length-1];
    delete beneficiaries[beneficiaries.length-1];
    beneficiaries.length--;

    LogRemoval(_name);
  }

  /// Assign an address `_addr` for beneficiary `_name` to withdraw from prior to withdrawal
  function assignWithdrawalAddress(address _addr, string _name) public onlyTrustee {
    var (exists, index) = findBeneficiary(_name);

    require(exists && !beneficiaries[index].hasWithdrawn);

    beneficiaries[index].withdrawalAddress = _addr;

    LogWithdrawalAddress(_addr, _name);
  }

  /// Trustor can deposit funds to the trust and this event will be logged
  function deposit() public payable onlyTrustor {
    LogDeposit(msg.value);
  }

  /// Returns the private trust contract balance
  function getBalance() public view returns (uint) {
    return this.balance;
  }

  // Searches the beneficiary array for a matching name `_name`
  // Returns a bool for exists, and the appropriate array index
  function findBeneficiary(string _name) private view returns (bool, uint) {
    for (uint i = 0; i < beneficiaries.length; i++) {
      if (keccak256(beneficiaries[i].name) == keccak256(_name)) {
        return (true, i);
      }
    }

    return (false, 0);
  }

  // Default non payable fallback function
  function() public { }

  // Selfdestructs trust contract and returns the funds to the trustor
  function remove() public onlyTrustor { selfdestruct(trustor); }
}
