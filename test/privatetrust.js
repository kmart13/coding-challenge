var PrivateTrust = artifacts.require("./PrivateTrust.sol");

const web3 = global.web3;

contract('PrivateTrust', function(accounts) {
  beforeEach(async function() {
    trust = await PrivateTrust.new({from: accounts[0]});
  });
}
