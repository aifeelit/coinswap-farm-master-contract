const { cssTokenDeploy } = require('./deployCssToken')
const { masterDeploy } = require('./deployMasterCss')
const { referralDeploy } = require('./deployCssReferral')

async function main() {

  console.log('Deploying css token');
  let deploymentData = await cssTokenDeploy();
  console.log('CssToken address: ', deploymentData.cssToken.address);

  //tutaj przeslac CSS tokeny na adres devdiv address

  console.log('Deploying masterCSS');
  deploymentData = await masterDeploy(deploymentData);
  console.log('CssToken address: ', deploymentData.masterCss.address);

  console.log('Deploying CSSReferral');
  deploymentData = await referralDeploy(deploymentData);
  console.log('CSSReferral address: ', deploymentData.referral.address);


  let owner = await deploymentData.cssToken.owner()
  console.log('Css Token owner address:', owner);
  await deploymentData.cssToken.transferOwnership(deploymentData.masterCss.address)

  await new Promise(resolve => setTimeout(resolve, 5000))

  owner = await deploymentData.cssToken.owner()
  console.log('Css Token owner address after change:', owner);

  await deploymentData.masterCss.setRewardReferral(deploymentData.referral.address)

  await new Promise(resolve => setTimeout(resolve, 5000))

  let rewardReferral = await deploymentData.masterCss.rewardReferral()
  console.log('Master reward referral address set to:', rewardReferral)

  await deploymentData.referral.setAdminStatus(deploymentData.masterCss.address, true)

  await new Promise(resolve => setTimeout(resolve, 5000))

  let masterIsReferralAdmin = await deploymentData.referral.isAdmin(deploymentData.masterCss.address)
  console.log('Master set as referral admin user:', masterIsReferralAdmin)

  //enable methods in master

  deploymentData.toJsonFile();
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
