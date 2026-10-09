class MediaLaunchPlanner {
  plan(options) {
    this._options = options || {};
    this._validate();
    this._resolveSettings();
    const args = this._buildArgs();
    return {
      binaryPath: this._resolveBinaryPath(),
      args,
      plan: this._describePlan(args),
    };
  }

  _validate() {
    throw new Error(`${this.constructor.name} must implement _validate()`);
  }

  _resolveSettings() {}

  _buildArgs() {
    throw new Error(`${this.constructor.name} must implement _buildArgs()`);
  }

  _resolveBinaryPath() {
    throw new Error(`${this.constructor.name} must implement _resolveBinaryPath()`);
  }

  _describePlan() {
    throw new Error(`${this.constructor.name} must implement _describePlan(args)`);
  }

  _requireOption(name) {
    if (!this._options[name]) throw new Error(`${this.constructor.name}: ${name} is required`);
  }
}

module.exports = MediaLaunchPlanner;
