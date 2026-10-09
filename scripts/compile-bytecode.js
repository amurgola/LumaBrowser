const BytecodeCompiler = require('../tools/build/bytecode/BytecodeCompiler');

const compileBytecode = (context) => new BytecodeCompiler().compile(context);

module.exports = compileBytecode;

if (require.main === module) {
  const appOutDir = process.argv[2];
  if (!appOutDir) {
    console.error('Usage: node scripts/compile-bytecode.js <appOutDir>');
    process.exit(1);
  }
  compileBytecode({ appOutDir }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
