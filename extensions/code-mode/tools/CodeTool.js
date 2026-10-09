class CodeTool {
  get name() {
    throw new Error(`${this.constructor.name} must define name`);
  }

  get description() {
    throw new Error(`${this.constructor.name} must define description`);
  }

  get inputSchema() {
    return { type: 'object', properties: {} };
  }

  get mutating() {
    return undefined;
  }

  async handle(_params, _opts) {
    throw new Error(`${this.constructor.name} must implement handle`);
  }

  toTool() {
    const tool = {
      name: this.name,
      description: this.description,
      inputSchema: this.inputSchema,
      handler: (params, opts = {}) => this.handle(params, opts),
    };
    if (this.mutating !== undefined) tool.mutating = this.mutating;
    return { ...tool, ...this._extraFields() };
  }

  _extraFields() {
    return {};
  }
}

module.exports = CodeTool;
