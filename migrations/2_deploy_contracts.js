var PrivateTrust = artifacts.require("./PrivateTrust.sol");

module.exports = function(deployer) {
  deployer.deploy(PrivateTrust);
};
