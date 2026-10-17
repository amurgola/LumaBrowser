const fs = require('fs');
const path = require('path');

class VersionBumper {
  static FILES = [
    { rel: 'package.json', lock: false, optional: false },
    { rel: 'package-lock.json', lock: true, optional: false },
    { rel: 'cli/package.json', lock: false, optional: true },
  ];

  constructor(repoRoot) {
    this._repoRoot = repoRoot;
  }

  static parse(version) {
    const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
    if (!match) throw new Error(`Unexpected version format: "${version}"`);
    return match.slice(1).map(Number);
  }

  static bump(version) {
    let [major, minor, patch] = VersionBumper.parse(version);
    patch += 1;
    if (patch === 10) {
      patch = 0;
      minor += 1;
      if (minor === 10) { minor = 0; major += 1; }
    }
    return `${major}.${minor}.${patch}`;
  }

  current() {
    const results = VersionBumper.FILES
      .map((file) => {
        const json = this._read(file);
        return json && { rel: file.rel, version: json.version };
      })
      .filter(Boolean);
    const versions = new Set(results.map((r) => r.version));
    return { results, version: results[0].version, consistent: versions.size === 1 };
  }

  execute(target) {
    if (target != null) VersionBumper.parse(target);
    const results = VersionBumper.FILES.map((file) => this._bumpFile(file, target)).filter(Boolean);
    const finals = new Set(results.map((r) => r.to));
    return { results, version: results[0].to, consistent: finals.size === 1 };
  }

  _read({ rel, optional }) {
    const full = path.join(this._repoRoot, rel);
    if (optional && !fs.existsSync(full)) return null;
    return JSON.parse(fs.readFileSync(full, 'utf8'));
  }

  _bumpFile(file, target) {
    const json = this._read(file);
    if (!json) return null;
    const from = json.version;
    const to = target != null ? target : VersionBumper.bump(from);
    json.version = to;
    if (file.lock && json.packages && json.packages['']) json.packages[''].version = to;
    fs.writeFileSync(path.join(this._repoRoot, file.rel), `${JSON.stringify(json, null, 2)}\n`);
    return { rel: file.rel, from, to };
  }
}

module.exports = VersionBumper;
