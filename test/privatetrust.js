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

    console.log(event.get()[0].event + ": " + event.get()[0].args.amount.valueOf() + " wei.");
    console.log("Trust Balance: " + await trust.getBalance() + " wei.");
  });

  it("should allow the trustor to assign a new trustee", async function() {
    await trust.assignTrustee(accounts[2], {from: trustor});
    assert.equal(await trust.trustee(), accounts[2], "The trustor should be able to assign a new trustee address");
    await trust.assignTrustee(trustee, {from: trustor});
    assert.equal(await trust.trustee(), trustee, "The trustor should be able to assign a new trustee address");
  });

  it("should allow the trustor to designate a new beneficiary", async function() {
  });
});
