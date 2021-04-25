const { exec } =  require('child_process');
const { cssToken } = require('../config-farm-master.json')
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

async function verifyCssToken() {
  let { stdout } = await sh(`npx hardhat verify ${cssToken} --network ${process.env.HARDHAT_NETWORK}`);
  for (let line of stdout.split('\n')) {
    console.log(`${line}`);
  }
}

module.exports = { verifyCssToken: verifyCssToken}