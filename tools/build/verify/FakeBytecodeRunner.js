const BuildFs = require('../BuildFs');
const path = require('path');

const fs = BuildFs.get();

class FakeBytecodeRunner {
  static MARKER = 'FAKE-JSC ';

  constructor() {
    this.compiled = [];
  }

  compile(jsFiles) {
    for (const file of jsFiles) {
      fs.writeFileSync(file.replace(/\.js$/, '.jsc'), FakeBytecodeRunner.MARKER + path.basename(file));
      this.compiled.push(file);
    }
    return new Map();
  }
}

module.exports = FakeBytecodeRunner;
