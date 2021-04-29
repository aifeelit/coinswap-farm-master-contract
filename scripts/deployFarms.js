const { deployer, pairs } = require('../secrets.json')
const { masterCss } = require('../config-farm-master.json')
const _ = require('lodash')

async function deployFarms() {

  const deployerAddress = deployer

  const MasterCSS = await ethers.getContractFactory("MasterCSS");

  const master = await MasterCSS.attach(masterCss);

  let orderedPairs = _.orderBy(pairs, ['pid'], ['asc'])

  for (const p of orderedPairs) {
    console.log(p.pid, p.symbol, p.lpAddress);
    await addFarmForPair(master, deployerAddress, p)
  }

}

async function addFarmForPair(master, deployer, pairInfo) {
  if (pairInfo.lpAddress === "") {
    console.log('No lp address for:', pairInfo.symbol)
    return;
  }
  await master.add(pairInfo.multiplier * 100, pairInfo.lpAddress, false, pairInfo.lastRewardBlock, pairInfo.fee).then((res) => {
    console.log('Adding farm response:', res);
  }, (error) => console.error(error))}


deployFarms()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
