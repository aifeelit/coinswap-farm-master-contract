const { masterCss } = require('../config-farm-master.json')
const moment = require('moment')

async function timelockTest() {


  const MasterCSS = await ethers.getContractFactory("MasterCSS");

  const masterContract = await MasterCSS.attach(masterCss);

  const dataEncoded = await masterContract.populateTransaction.setEnableMethod(0, true);

  console.log(dataEncoded.data);

  const Timelock = await ethers.getContractFactory("Timelock");

  const timelockContract = await Timelock.attach('0x97F9CBE37858aC5D5C92dc2f4c2725C9F07D3028');

  const eta = moment(moment.now()).add(630, 'seconds').unix()

  console.log(moment(moment.now()).add(630, 'seconds').local().toISOString())
  await timelockContract.queueTransaction(masterCss, 0, 0, dataEncoded.data, eta)
  console.log('Timelock action scheduled with values:', `${masterCss}, 0, 0, ${dataEncoded.data}, ${eta}`);

}

timelockTest()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

