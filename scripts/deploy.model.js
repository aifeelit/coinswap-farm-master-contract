const path = require('path');
const fs = require('fs');

function DeployModel() {

  let self = this;
  this.deployerAddress = null;
  this.factory = null;
  this.cssToken = null;
  this.masterCss = null;
  this.router = null;
  this.referral = null;

  this.toJsonFile = function toJsonFile() {
    fs.writeFileSync( path.join('./', 'config-farm-master.json'), JSON.stringify({
        cssToken: self.cssToken.address,
        masterCss: self.masterCss.address,
        referral: self.referral.address,
        deployer: self.deployerAddress
      }
    ))
  }
}

module.exports = { DeployModel: DeployModel }
