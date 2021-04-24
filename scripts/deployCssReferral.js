const { deployer } = require('../secrets.json')
const { DeployModel } = require('./deploy.model')

async function referralDeploy(deployData) {

  if (!deployData)
    deployData = new DeployModel();

  const deployerAddress = deployer

  deployData.deployerAddress = deployer

  const CSSReferral = await ethers.getContractFactory("contracts/CSSReferral.sol:CssReferral");

  const referral = await CSSReferral.deploy();

  console.log("CSSReferral deployed to:", referral.address);

  deployData.referral = referral

  console.log("CSSReferral deployed by:", deployerAddress);

  return deployData;
}
//
// main()
//   .then(() => process.exit(0))
//   .catch(error => {
//     console.error(error);
//     process.exit(1);
//   });

module.exports = { referralDeploy: referralDeploy}