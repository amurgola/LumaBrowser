class BytecodeStub {
  static PREFIX = "'use strict';\nrequire('bytenode');";

  static text(jscName) {
    return `${BytecodeStub.PREFIX}\nmodule.exports = require('./${jscName}');\n`;
  }

  static isStub(content) {
    return String(content || '').startsWith(BytecodeStub.PREFIX);
  }

  static jscPathFor(jsPath) {
    return jsPath.replace(/\.js$/, '.jsc');
  }
}

module.exports = BytecodeStub;
