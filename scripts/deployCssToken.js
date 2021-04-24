const { deployer } = require('../secrets.json')
const { DeployModel } = require('./deploy.model')

async function cssTokenDeploy(deployData) {

  if (!deployData)
    deployData = new DeployModel();

  const deployerAddress = deployer

  deployData.deployerAddress = deployer

  const CSSToken = await ethers.getContractFactory("CssToken");

  const token = await CSSToken.deploy();

  console.log("CSSToken deployed to:", token.address);

  deployData.cssToken = token

  console.log("CSSToken deployed by:", deployerAddress);

  return deployData;
}

// cssTokenDeploy()
//   .then(() => process.exit(0))
//   .catch(error => {
//     console.error(error);
//     process.exit(1);
//   });

module.exports = { cssTokenDeploy: cssTokenDeploy}