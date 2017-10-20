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

  uint private activeBeneficiaries;

  Beneficiary[] private beneficiaries;

  event LogDeposit(uint amount);
  event LogDesignation(string name, uint age);
  event LogRemoval(string name);
  event LogAddress(address addr, string name);
  event LogWithdrawal(address addr, string name, uint amount);

  modifier onlyTrustor() { require(msg.sender == trustor); _; }
  modifier onlyTrustee() { require(msg.sender == trustee); _; }
  modifier containsFunds() { require(this.balance >= activeBeneficiaries); _; }

  function PrivateTrust() public {
    trustor = msg.sender;
    activeBeneficiaries = 0;
  }

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
      require(!beneficiaries[index].hasWithdrawn);
      beneficiaries[index].maturityAge = _age;
    } else {
      beneficiaries.push(Beneficiary(DEFAULT_ADDRESS, _name, _age, false));
    }

    activeBeneficiaries++;

    LogDesignation(_name, _age);
  }

  /// Remove a beneficiary from the trust matching the full legal name `_name`
  function removeBeneficiary(string _name) public onlyTrustee {
    var (exists, index) = findBeneficiary(_name);

    require(exists);
    require(!beneficiaries[index].hasWithdrawn);

    beneficiaries[index] = beneficiaries[beneficiaries.length-1];
    delete beneficiaries[beneficiaries.length-1];
    beneficiaries.length--;
    activeBeneficiaries--;

    LogRemoval(_name);
  }

  /// Assign a withdrawal address `_addr` for beneficiary `_name` and verified age by trustee `_age`
  function assignWithdrawalAddress(address _addr, string _name, uint _age) public onlyTrustee {
    var (exists, index) = findBeneficiary(_name);

    require(exists);
    require(!beneficiaries[index].hasWithdrawn);
    require(_age >= beneficiaries[index].maturityAge);

    beneficiaries[index].withdrawalAddress = _addr;

    LogAddress(_addr, _name);
  }

  /// Withdraw beneficiary's `_name` portion of the trust to address `_addr`
  function withdraw(address _addr, string _name) public containsFunds {
    var (exists, index) = findBeneficiary(_name);

    require(exists);
    require(!beneficiaries[index].hasWithdrawn);
    require(beneficiaries[index].withdrawalAddress == _addr && _addr != DEFAULT_ADDRESS);

    uint amount = this.balance / activeBeneficiaries;

    if (_addr.send(amount)) {
      beneficiaries[index].hasWithdrawn = true;
      activeBeneficiaries--;

      LogWithdrawal(_addr, _name, amount);
    }
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
