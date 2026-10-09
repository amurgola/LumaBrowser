const fs = require('fs');
const InstallRecord = require('./InstallRecord');

class AppExecutable {
  static resolve({ env = process.env, proc = process, exists = fs.existsSync, readRecord = InstallRecord.read } = {}) {
    if (env.LUMA_APP_EXE && exists(env.LUMA_APP_EXE)) return env.LUMA_APP_EXE;
    const own = AppExecutable._ownBinary(env, proc, exists);
    if (own) return own;
    const record = readRecord();
    if (record && record.executable && exists(record.executable)) return record.executable;
    return null;
  }

  static _ownBinary(env, proc, exists) {
    if (!(proc.versions && proc.versions.electron)) return null;
    if (env.APPIMAGE && exists(env.APPIMAGE)) return env.APPIMAGE;
    if (proc.execPath && exists(proc.execPath)) return proc.execPath;
    return null;
  }
}

module.exports = AppExecutable;
