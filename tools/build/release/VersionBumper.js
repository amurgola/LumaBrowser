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

  static bump(version) {
    const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
    if (!match) throw new Error(`Unexpected version format: "${version}"`);
    let [major, minor, patch] = match.slice(1).map(Number);
    patch += 1;
    if (patch === 10) {
      patch = 0;
      minor += 1;
      if (minor === 10) { minor = 0; major += 1; }
    }
    return `${major}.${minor}.${patch}`;
  }

  execute() {
    const results = VersionBumper.FILES.map((file) => this._bumpFile(file)).filter(Boolean);
    const finals = new Set(results.map((r) => r.to));
    return { results, version: results[0].to, consistent: finals.size === 1 };
  }

  _bumpFile({ rel, lock, optional }) {
    const full = path.join(this._repoRoot, rel);
    if (optional && !fs.existsSync(full)) return null;
    const json = JSON.parse(fs.readFileSync(full, 'utf8'));
    const from = json.version;
    const to = VersionBumper.bump(from);
    json.version = to;
    if (lock && json.packages && json.packages['']) json.packages[''].version = to;
    fs.writeFileSync(full, `${JSON.stringify(json, null, 2)}\n`);
    return { rel, from, to };
  }
}

module.exports = VersionBumper;
