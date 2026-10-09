class ReadOnlyCatalog {
  constructor(profiles) {
    this._profiles = new Map();
    profiles.forEach((profile) => this._register(profile));
  }

  knows(name) {
    return this._profiles.has(name);
  }

  names() {
    return [...this._profiles.keys()];
  }

  judge(name, args) {
    const profile = this._profiles.get(name);
    return profile ? profile.judge(name, args) : null;
  }

  _register(profile) {
    for (const name of profile.names) {
      if (this._profiles.has(name)) throw new Error(`${this.constructor.name} lists ${name} twice`);
      this._profiles.set(name, profile);
    }
  }
}

module.exports = ReadOnlyCatalog;
