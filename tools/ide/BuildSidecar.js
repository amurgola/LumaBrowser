const fs = require('fs');

class BuildSidecar {
  constructor(file) {
    this.file = file;
  }

  isUpToDate(version, sourceMtime) {
    const last = this.read();
    return !!last && last.version === version && last.sourceMtime >= sourceMtime;
  }

  read() {
    try { return JSON.parse(fs.readFileSync(this.file, 'utf8')); } catch (_) { return null; }
  }

  write(fields) {
    fs.writeFileSync(this.file, JSON.stringify({ ...fields, builtAt: new Date().toISOString() }, null, 2));
  }
}

module.exports = BuildSidecar;
