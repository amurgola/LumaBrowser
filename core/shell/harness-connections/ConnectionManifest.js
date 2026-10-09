const ConfigFile = require('./ConfigFile');

class ConnectionManifest {
  static VERSION = 2;

  constructor(file) {
    this._file = file;
  }

  file() {
    return this._file;
  }

  entry(harness) {
    return this._read().connections.find((e) => e.harness === harness) || null;
  }

  save(entry, tx = null) {
    const manifest = this._read();
    manifest.connections = [...manifest.connections.filter((e) => e.harness !== entry.harness), entry];
    this._write(manifest, tx);
  }

  drop(harness, tx = null) {
    const manifest = this._read();
    manifest.connections = manifest.connections.filter((e) => e.harness !== harness);
    this._write(manifest, tx);
  }

  _read() {
    try {
      const parsed = JSON.parse(ConfigFile.readTextOr(this._file, '{}'));
      return { version: ConnectionManifest.VERSION, connections: Array.isArray(parsed && parsed.connections) ? parsed.connections : [] };
    } catch (_) {
      return { version: ConnectionManifest.VERSION, connections: [] };
    }
  }

  _write(manifest, tx) {
    const text = `${JSON.stringify(manifest, null, 2)}\n`;
    if (tx) tx.write(this._file, text);
    else ConfigFile.writeAtomic(this._file, text);
  }
}

module.exports = ConnectionManifest;
