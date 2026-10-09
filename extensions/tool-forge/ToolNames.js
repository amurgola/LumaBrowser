class ToolNames {
  constructor({ store, getExistingNames }) {
    this._store = store;
    this._getExistingNames = getExistingNames || (() => []);
  }

  collides(name) {
    const own = new Set(this._store.list().map((tool) => tool.name));
    return this._getExistingNames().some((existing) => existing === name && !own.has(name));
  }

  freeName(base) {
    let name = base;
    for (let n = 2; this._store.get(name) || this.collides(name); n++) name = `${base}_${n}`;
    return name;
  }

  summary(exceptName = null) {
    return this._store.list()
      .filter((tool) => tool.name !== exceptName)
      .map((tool) => `${tool.name} (${tool.status})`);
  }

  notFound(name) {
    const existing = this.summary();
    return {
      success: false,
      error: `No tool named "${name}".`
        + (existing.length
          ? ` Your existing tools: ${existing.join(', ')}. Use one of those exact names, or create_tool to start a new one.`
          : ' Create it first with create_tool.'),
      existingTools: existing,
    };
  }
}

module.exports = ToolNames;
