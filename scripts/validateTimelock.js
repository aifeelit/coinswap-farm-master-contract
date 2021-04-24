const { exec } =  require('child_process');
const { deployer } = require('../secrets.json')
/**
 * Execute simple shell command (async wrapper).
 * @param {String} cmd
 * @return {Object} { stdout: String, stderr: String }
 */
async function sh(cmd) {
  return new Promise(function (resolve, reject) {
    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        reject(err);
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

async function verifyTimelock() {
  const timelock = "0x97F9CBE37858aC5D5C92dc2f4c2725C9F07D3028";
  let { stdout } = await sh(`npx hardhat verify ${timelock} ${deployer} 600 --network testnet`);
  for (let line of stdout.split('\n')) {
    console.log(`${line}`);
  }
}

verifyTimelock()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
