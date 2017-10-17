var PrivateTrust = artifacts.require("./PrivateTrust.sol");

//const web3 = global.web3;

contract('PrivateTrust', function(accounts) {
  var event;
  var trust;
  var trustor = accounts[0];
  var trustee = accounts[1];

  async function shouldThrow(func, message) {
    var errorThrown;
    try {
      errorThrown = false;
      await func();
    } catch(error) {
      errorThrown = true;
    }

    assert.equal(errorThrown, true, message);
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

    event = trust.LogDeposit(function(error, result) {});

    await trust.deposit({from: trustor, value: amount});

    assert.equal(await trust.getBalance(), amount, "The private trust should contain the deposited amount");
    assert.equal(event.get()[0].event, "LogDeposit", "Log event should be 'LogDeposit'");
    assert.equal(event.get()[0].args.amount.valueOf(), amount, "LogDeposit should show the value deposited");

    await shouldThrow(async function() {
      await trust.deposit({from: trustee, value: amount}), "Only trustor can deposit"
    });
  });

  it("should allow the trustor to assign a new trustee", async function() {
    await trust.assignTrustee(accounts[2], {from: trustor});
    assert.equal(await trust.trustee(), accounts[2], "The trustor should be able to assign a new trustee address");
    await trust.assignTrustee(trustee, {from: trustor});
    assert.equal(await trust.trustee(), trustee, "The trustor should be able to assign a new trustee address");

    await shouldThrow(async function() {
      await trust.assignTrustee(accounts[4], {from: trustee}), "Only trustor can assign new trustee"
    });
  });

  it("should allow the trustor to designate a new beneficiary", async function() {
    event = trust.LogDesignation(function(error, result) {});

    await trust.designateBeneficiary("Test", 30, {from: trustor});

    assert.equal(event.get()[0].event, "LogDesignation", "Log event should be 'LogDesignation'");
    assert.equal(event.get()[0].args.name.valueOf(), "Test", "Trustor should have designated Test as a trustee");
    assert.equal(event.get()[0].args.age.valueOf(), 30, "Trustor should have set Test's withdrawal age to 30");

    await trust.designateBeneficiary("Test", 35, {from: trustor});

    assert.equal(event.get()[0].event, "LogDesignation", "Log event should be 'LogDesignation'");
    assert.equal(event.get()[0].args.age.valueOf(), 35, "Trustor should have updated Test's withdrawal age to 35");

    await shouldThrow(async function() {
      await trust.designateBeneficiary("Test", 50, {from: trustee}), "Only trustor can designate a beneficiary"
    });
  });

  it("should allow the trustee to remove a beneficiary", async function() {
    event = trust.LogRemoval(function(error, result) {});

    await trust.designateBeneficiary("Test", 30, {from: trustor});
    await trust.removeBeneficiary("Test", {from: trustee});

    assert.equal(event.get()[0].event, "LogRemoval", "Log event should be 'LogRemoval'");
    assert.equal(event.get()[0].args.name.valueOf(), "Test", "Test should be removed as a beneficiary");

    await shouldThrow(async function() {
      await trust.removeBeneficiary("Test", {from: trustee}), "Should not be able to remove undesignated beneficiary"
    });

    await shouldThrow(async function() {
      await trust.designateBeneficiary("Test", 30, {from: trustor});
      await trust.removeBeneficiary("Test", {from: trustor}), "Only trustee can remove a beneficiary"
    });
  });

  it("should allow the trustee to remove a beneficiary", async function() {
  });
});
