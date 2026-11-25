const fs = require('fs');

class EsModuleSource {
  static STATEMENT = /^[ \t]*(?:import[\s{*'"]|export[\s{*])/m;

  static isModule(file) {
    try {
      return EsModuleSource.STATEMENT.test(fs.readFileSync(file, 'utf8'));
    } catch (_) {
      return false;
    }
  }
}

module.exports = EsModuleSource;
