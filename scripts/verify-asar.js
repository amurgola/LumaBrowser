const path = require('path');
const AsarLayoutVerifier = require('../tools/build/verify/AsarLayoutVerifier');

const projectRoot = path.resolve(__dirname, '..');
const asarFlag = process.argv.indexOf('--asar');
const asarArg = asarFlag === -1 ? null : process.argv[asarFlag + 1];

if (!asarArg) {
  console.error('Usage: node scripts/verify-asar.js --asar <path to app.asar>');
  process.exit(2);
}

try {
  const { fail } = new AsarLayoutVerifier({ asarPath: path.resolve(asarArg), sourceRoot: projectRoot }).verify();
  process.exit(fail === 0 ? 0 : 1);
} catch (err) {
  console.error('[verify] ERROR:', err);
  process.exit(2);
}
