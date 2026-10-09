const path = require('path');
const AsarBytecodeVerifier = require('../tools/build/verify/AsarBytecodeVerifier');
const SimulatedPack = require('../tools/build/verify/SimulatedPack');

const projectRoot = path.resolve(__dirname, '..');
const asarFlag = process.argv.indexOf('--asar');

const run = async () => {
  if (asarFlag === -1) return new SimulatedPack({ projectRoot }).run();
  const asarPath = path.resolve(process.argv[asarFlag + 1] || '');
  return new AsarBytecodeVerifier({ asarPath, sourceRoot: projectRoot }).verify();
};

run().then(({ fail }) => process.exit(fail === 0 ? 0 : 1)).catch((err) => {
  console.error('[verify] ERROR:', err);
  process.exit(2);
});
