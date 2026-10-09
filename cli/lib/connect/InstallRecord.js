const fs = require('fs');
const LumaHome = require('./LumaHome');

class InstallRecord {
  static FILE_NAME = 'install.json';

  static path() {
    return LumaHome.file(InstallRecord.FILE_NAME);
  }

  static read() {
    try { return JSON.parse(fs.readFileSync(InstallRecord.path(), 'utf8')); } catch (_) { return null; }
  }

  static write(record) {
    fs.mkdirSync(LumaHome.dir(), { recursive: true });
    fs.writeFileSync(InstallRecord.path(), JSON.stringify(record, null, 2));
  }
}

module.exports = InstallRecord;
