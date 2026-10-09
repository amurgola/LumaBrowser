class PowerShellSyntaxCollector {
  static MAX_DIAGNOSTICS = 25;

  static collect(rootNode, source) {
    return new PowerShellSyntaxCollector(source).execute(rootNode);
  }

  constructor(source) {
    this._source = source;
    this._diagnostics = [];
  }

  execute(rootNode) {
    this._visit(rootNode);
    if (this._diagnostics.length === 0) this._addUnlocatedFailure();
    return this._diagnostics;
  }

  _visit(node) {
    if (this._diagnostics.length >= PowerShellSyntaxCollector.MAX_DIAGNOSTICS) return;
    if (node.isError) {
      this._diagnostics.push(this._errorDiagnostic(node));
      return;
    }
    if (node.isMissing) this._diagnostics.push(this._missingDiagnostic(node));
    for (let i = 0; i < node.childCount; i++) this._visit(node.child(i));
  }

  _errorDiagnostic(node) {
    return {
      line: node.startPosition.row + 1,
      column: node.startPosition.column + 1,
      endLine: node.endPosition.row + 1,
      endColumn: node.endPosition.column + 1,
      severity: 'error',
      message: `Syntax error near "${PowerShellSyntaxCollector._snippet(node.text)}"`,
      ruleId: 'ps-syntax',
      source: this._source,
    };
  }

  _missingDiagnostic(node) {
    return {
      line: node.startPosition.row + 1,
      column: node.startPosition.column + 1,
      severity: 'error',
      message: `Missing '${node.type}'`,
      ruleId: 'ps-missing',
      source: this._source,
    };
  }

  _addUnlocatedFailure() {
    this._diagnostics.push({
      line: 1,
      column: 1,
      severity: 'error',
      message: 'PowerShell parse error (could not fully parse the script).',
      ruleId: 'ps-syntax',
      source: this._source,
    });
  }

  static _snippet(text) {
    return String(text || '').replace(/\s+/g, ' ').trim().slice(0, 40);
  }
}

module.exports = PowerShellSyntaxCollector;
