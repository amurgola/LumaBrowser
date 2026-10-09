class GameTool {
  constructor(scope) {
    this._scope = scope;
  }

  get name() { throw new Error(`${this.constructor.name} must implement name`); }

  get description() { throw new Error(`${this.constructor.name} must implement description`); }

  get inputSchema() { throw new Error(`${this.constructor.name} must implement inputSchema`); }

  get sandboxed() { return false; }

  async run(_params, _opts) { throw new Error(`${this.constructor.name} must implement run`); }

  get onResultEvicted() { return null; }

  toDefinition() {
    const def = {
      name: this.name,
      description: this.description,
      inputSchema: this.inputSchema,
      handler: (params, opts) => this.run(params, opts),
    };
    if (this.sandboxed) def.sandboxed = true;
    if (typeof this.onResultEvicted === 'function') def.onResultEvicted = this.onResultEvicted;
    return def;
  }
}

module.exports = GameTool;
