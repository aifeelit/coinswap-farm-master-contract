const { masterCss } = require('../config-farm-master.json')
const moment = require('moment')

async function timelockTest() {

  const Timelock = await ethers.getContractFactory("Timelock");

  const timelockContract = await Timelock.attach('0x97F9CBE37858aC5D5C92dc2f4c2725C9F07D3028');

  console.log(moment(moment.now()).add(630, 'seconds').local().toISOString())
  const res = await timelockContract.executeTransaction(masterCss, 0, 0, "0xc8133f6700000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001", 1619282149)

  console.log(res);
}

timelockTest()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

