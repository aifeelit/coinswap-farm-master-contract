const { deployer } = require('../secrets.json')

async function deployTimelock() {

  const deployerAddress = deployer

  const Timelock = await ethers.getContractFactory("Timelock");

  const token = await Timelock.deploy(deployer, 600);

  console.log("Timelock deployed to:", token.address);
  console.log("Timelock deployed by:", deployerAddress);

}

deployTimelock()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

