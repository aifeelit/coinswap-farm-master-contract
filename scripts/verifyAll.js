const { verifyCssToken } = require('./verifyCssToken')
const { verifyCssReferral } = require('./verifyCssReferral')
const { verifyMasterCss } = require('./verifyMasterCss')

async function main() {
  console.log('Verifying CSS Token')
  await verifyCssToken()
  console.log('Verifying CSS Referral')
  await verifyCssReferral()
  console.log('Verifying Master CSS')
  await verifyMasterCss()

}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
