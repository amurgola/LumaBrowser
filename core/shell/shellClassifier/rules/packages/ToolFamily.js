class ToolFamily {
  buildTable() {
    throw new Error(`${this.constructor.name} must implement buildTable()`);
  }

  get table() {
    if (!this._table) this._table = this.buildTable();
    return this._table;
  }

  handles(tool) {
    return this.table.has(this.tableKey(tool));
  }

  findRisk(tool, toolArgs) {
    return this.table.match(this.tableKey(tool), toolArgs, tool);
  }

  tableKey(tool) {
    return tool;
  }
}

module.exports = ToolFamily;
