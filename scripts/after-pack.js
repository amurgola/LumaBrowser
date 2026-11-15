const DistributableExtensionPruner = require('../tools/build/pack/DistributableExtensionPruner');
const WerHelperRenamer = require('../tools/build/pack/WerHelperRenamer');

const afterPack = async (context) => {
  const removed = await new DistributableExtensionPruner().prune(context);
  new WerHelperRenamer().rename(context);
  return removed;
};

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
