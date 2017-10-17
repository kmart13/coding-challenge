var PrivateTrust = artifacts.require("./PrivateTrust.sol");

const web3 = global.web3;

contract('PrivateTrust', function(accounts) {
  var event;
  var trustor = accounts[0];
  var trustee = accounts[1];

  beforeEach(async function() {
    accounts[0].balance = 1000000000000000000000000000;
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

    var errorThrown;
    try {
      errorThrown = false;
      await trust.deposit({from: trustee, value: amount});
    } catch (error) {
      errorThrown = true;
    }

    assert.equal(errorThrown, true, "Non trustor should not be allowed to deposit");
  });

  it("should allow the trustor to assign a new trustee", async function() {
    await trust.assignTrustee(accounts[2], {from: trustor});
    assert.equal(await trust.trustee(), accounts[2], "The trustor should be able to assign a new trustee address");
    await trust.assignTrustee(trustee, {from: trustor});
    assert.equal(await trust.trustee(), trustee, "The trustor should be able to assign a new trustee address");

    var errorThrown;
    try {
      errorThrown = false;
      await trust.assignTrustee(accounts[4], {from: trustee});
    } catch (error) {
      errorThrown = true;
    }

    assert.equal(errorThrown, true, "Non trustor should not be allowed to assign a new trustee");
  });

  it("should allow the trustor to designate a new beneficiary", async function() {
    event = trust.LogDesignation(function(error, result) {});

    await trust.designateBeneficiary("John Doe Smith", 30, {from: trustor});

    assert.equal(event.get()[0].event, "LogDesignation", "Log event should be 'LogDesignation'");
    assert.equal(event.get()[0].args.name.valueOf(), "John Doe Smith", "Trustor should have designated John Doe Smith as a trustee");
    assert.equal(event.get()[0].args.age.valueOf(), 30, "Trustor should have set John Doe Smith's withdrawal age to 30");

    await trust.designateBeneficiary("John Doe Smith", 35, {from: trustor});

    assert.equal(event.get()[0].event, "LogDesignation", "Log event should be 'LogDesignation'");
    assert.equal(event.get()[0].args.age.valueOf(), 35, "Trustor should have updated John Doe Smith's withdrawal age to 35");

    var errorThrown;
    try {
      errorThrown = false;
      await trust.designateBeneficiary("Test", 50, {from: trustee});
    } catch (error) {
      errorThrown = true;
    }

    assert.equal(errorThrown, true, "Non trustor should not be allowed to designate a beneficiary");
  });

  it("should allow the trustor to designate a new beneficiary", async function() {
    event = trust.LogRemoval(function(error, result) {});

    await trust.designateBeneficiary("John Doe Smith", 30, {from: trustor});
    await trust.removeBeneficiary("John Doe Smith", {from: trustee});

    assert.equal(event.get()[0].event, "LogRemoval", "Log event should be 'LogRemoval'");
    assert.equal(event.get()[0].args.name.valueOf(), "John Doe Smith", "John Doe Smith should be removed as a beneficiary");

    var errorThrown;
    try {
      errorThrown = false;
      await trust.removeBeneficiary("John Doe Smith", {from: trustee});
    } catch (error) {
      errorThrown = true;
    }

    assert.equal(errorThrown, true, "Should not be able to remove undesignated beneficiary");

    try {
      errorThrown = false;
      await trust.designateBeneficiary("John Doe Smith", 30, {from: trustor});
      await trust.removeBeneficiary("John Doe Smith", {from: trustor});
    } catch (error) {
      errorThrown = true;
    }

    assert.equal(errorThrown, true, "Non trustor should not be allowed to remove a beneficiary");
  });
});
