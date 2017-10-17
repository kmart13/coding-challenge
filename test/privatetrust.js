var PrivateTrust = artifacts.require("./PrivateTrust.sol");

//const web3 = global.web3;

contract('PrivateTrust', function(accounts) {
  var event;
  var trust;
  var madeIt;
  var errorThrown;
  var trustor = accounts[0];
  var trustee = accounts[1];

  async function shouldThrow(func, message) {
    madeIt = false;

    try {
      errorThrown = false;
      await func();
    } catch(error) {
      errorThrown = true;
    }

    console.log("MadeIt: " + madeIt);
    console.log("ErrorThrown: " + errorThrown);

    assert.equal(errorThrown, true, message);

    //trust = await PrivateTrust.new({from: trustor});
    //await trust.assignTrustee(trustee, {from: trustor});
  }

  beforeEach(async function() {
    trust = await PrivateTrust.new({from: trustor});
    await trust.assignTrustee(trustee, {from: trustor});
  });

  afterEach(async function() {
    event.stopWatching();
  });

  it("should allow the trustor to deposit to the contract", async function() {
    var amount = web3.toWei(1, "ether");

    await shouldThrow(async function() {
      madeIt = true;
      await trust.deposit({from: trustee, value: amount});
    }, "Only trustor can deposit");

    event = trust.LogDeposit(function(error, result) {});

    await trust.deposit({from: trustor, value: amount});

    assert.equal(await trust.getBalance(), amount, "The private trust should contain the deposited amount");
    assert.equal(event.get()[0].event, "LogDeposit", "Log event should be 'LogDeposit'");
    assert.equal(event.get()[0].args.amount.valueOf(), amount, "LogDeposit should show the value deposited");
  });

  it("should allow the trustor to assign a new trustee", async function() {
    await shouldThrow(async function() {
      madeIt = true;
      await trust.assignTrustee(accounts[4], {from: trustee});
    }, "Only trustor can assign new trustee");

    await trust.assignTrustee(accounts[2], {from: trustor});
    assert.equal(await trust.trustee(), accounts[2], "The trustor should be able to assign a new trustee address");

    await trust.assignTrustee(trustee, {from: trustor});
    assert.equal(await trust.trustee(), trustee, "The trustor should be able to assign a new trustee address");
  });

  it("should allow the trustor to designate a new beneficiary", async function() {
    await shouldThrow(async function() {
      madeIt = true;
      await trust.designateBeneficiary("Test", 50, {from: trustee});
    }, "Only trustor can designate a beneficiary");

    await shouldThrow(async function() {
      await trust.deposit({from: trustor, value: 10});
      await trust.designateBeneficiary("Test", 50, {from: trustor});
      await trust.assignWithdrawalAddress(accounts[7], "Test", 50, {from: trustee})
      await trust.withdraw(accounts[7], "Test", {from: accounts[7]});
      madeIt = true;
      await trust.designateBeneficiary("Test", 30, {from: trustor});
    }, "Can't designate new age if beneficiary has already withdrawn");

    event = trust.LogDesignation(function(error, result) {});

    await trust.designateBeneficiary("Test", 30, {from: trustor});

    assert.equal(event.get()[0].event, "LogDesignation", "Log event should be 'LogDesignation'");
    assert.equal(event.get()[0].args.name.valueOf(), "Test", "Trustor should have designated Test as a trustee");
    assert.equal(event.get()[0].args.age.valueOf(), 30, "Trustor should have set Test's withdrawal age to 30");

    await trust.designateBeneficiary("Test", 35, {from: trustor});

    assert.equal(event.get()[0].event, "LogDesignation", "Log event should be 'LogDesignation'");
    assert.equal(event.get()[0].args.age.valueOf(), 35, "Trustor should have updated Test's withdrawal age to 35");
  });

  it("should allow the trustee to remove a beneficiary", async function() {
    await shouldThrow(async function() {
      madeIt = true;
      await trust.removeBeneficiary("Test", {from: trustor});
    }, "Only trustee can remove a beneficiary");

    await shouldThrow(async function() {
      madeIt = true;
      await trust.removeBeneficiary("Test", {from: trustee});
    }, "Should not be able to remove undesignated beneficiary");

    await shouldThrow(async function() {
      await trust.designateBeneficiary("Test", 50, {from: trustor});
      await trust.assignWithdrawalAddress(accounts[7], "Test", 50, {from: trustee})
      await trust.withdraw(accounts[7], "Test", {from: accounts[7]});
      madeIt = true;
      await trust.removeBeneficiary("Test", {from: trustee});
    }, "Can't remove a beneficiary if they have already withdrawn");

    event = trust.LogRemoval(function(error, result) {});

    await trust.designateBeneficiary("Test", 30, {from: trustor});
    await trust.removeBeneficiary("Test", {from: trustee});

    assert.equal(event.get()[0].event, "LogRemoval", "Log event should be 'LogRemoval'");
    assert.equal(event.get()[0].args.name.valueOf(), "Test", "Test should be removed as a beneficiary");
  });

  it("should allow the trustee to assign a withdrawal address", async function() {
    await shouldThrow(async function() {
      madeIt = true;
      await trust.assignWithdrawalAddress(accounts[7], "Test", 20, {from: trustor});
    }, "Only trustee can assign address");

    await shouldThrow(async function() {
      madeIt = true;
      await trust.assignWithdrawalAddress(accounts[7], "Test", 20, {from: trustee});
    }, "Can't assign address to undesignated beneficiary");

    await shouldThrow(async function() {
      await trust.designateBeneficiary("Test", 50, {from: trustor});
      await trust.assignWithdrawalAddress(accounts[7], "Test", 50, {from: trustee})
      await trust.withdraw(accounts[7], "Test", {from: accounts[7]});
      madeIt = true;
      await trust.assignWithdrawalAddress(accounts[8], "Test", 50, {from: trustee})
    }, "Can't assign address if beneficiary has already withdrawn");

    await shouldThrow(async function() {
      await trust.designateBeneficiary("Test", 50, {from: trustor});
      madeIt = true;
      await trust.assignWithdrawalAddress(accounts[7], "Test", 40, {from: trustee})
    }, "Can't assign address if beneficiary age does not meet withdrawal age");

    event = trust.LogAddress(function(error, result) {});

    await trust.designateBeneficiary("Test", 30, {from: trustor});
    await trust.assignWithdrawalAddress(accounts[7], "Test", 30, {from: trustee});

    assert.equal(event.get()[0].event, "LogAddress", "Log event should be 'LogAddress'");
    assert.equal(event.get()[0].args.addr.valueOf(), accounts[7], "Test should be assigned a withdrawal address");
    assert.equal(event.get()[0].args.name.valueOf(), "Test", "The withdrawal address should be assigned to Test");
  });
});
