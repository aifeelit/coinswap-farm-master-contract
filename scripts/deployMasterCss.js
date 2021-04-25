const { deployer, masterConfig } = require('../secrets.json')
const { DeployModel } = require('./deploy.model')

async function masterDeploy(deployData) {

  if (!deployData)
    deployData = new DeployModel();

  const stakeTokenAddr = deployData.cssToken.address

  const deployerAddress = deployer

  deployData.deployerAddress = deployer

  const MasterCSS = await ethers.getContractFactory("MasterCSS");

  const master = await MasterCSS.deploy(stakeTokenAddr, masterConfig.devAddress, masterConfig.treasuryAddress, masterConfig.startBlock);

  console.log("MasterCSS deployed to:", master.address);

  deployData.masterCss = master

  console.log("MasterCSS deployed by:", deployerAddress);
  console.log("MasterCSS stake token address:", stakeTokenAddr);
  console.log("MasterCSS dev address:", masterConfig.devAddress);
  console.log("MasterCSS treasury address:", masterConfig.treasuryAddress);
  console.log("MasterCSS start block:", masterConfig.startBlock);

  return deployData;
}

// masterDeploy()
//   .then(() => process.exit(0))
//   .catch(error => {
//     console.error(error);
//     process.exit(1);
//   });

module.exports = { masterDeploy: masterDeploy}