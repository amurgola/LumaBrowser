class ConnectionPlan {
  constructor() {
    this._settings = [];
  }

  file(file, format) {
    const add = (seedOnly) => (path, value) => {
      this._settings.push({ file, format, path, value, seedOnly });
      return writer;
    };
    const writer = { set: add(false), seed: add(true) };
    return writer;
  }

  settings() {
    return [...this._settings];
  }

  files() {
    return [...new Set(this._settings.map((s) => s.file))];
  }
}

module.exports = ConnectionPlan;
