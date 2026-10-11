const DistributableExtensionPruner = require('../tools/build/pack/DistributableExtensionPruner');

const afterPack = (context) => new DistributableExtensionPruner().prune(context);

module.exports = afterPack;

if (require.main === module) {
  const appOutDir = process.argv[2];
  if (!appOutDir) {
    console.error('Usage: node scripts/after-pack.js <appOutDir>');
    process.exit(1);
  }
  afterPack({ appOutDir }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
