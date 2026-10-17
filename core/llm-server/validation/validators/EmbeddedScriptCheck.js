class EmbeddedScriptCheck {
  static RUNNER_NAMES = new Set(['executeJs', 'executeJavaScript', 'executeScript', 'evaluate', 'evaluateHandle']);
  static SCRIPT_START = /^\s*[;!]?\s*\(\s*(?:async\s+)?(?:function\b|\([^)]*\)\s*=>|[A-Za-z_$][\w$]*\s*=>)/;
  static MIN_CHARS = 40;
  static PLACEHOLDER = '0';

  static check(ast) {
    const out = [];
    for (const node of EmbeddedScriptCheck._scriptTemplates(ast)) {
      const problem = EmbeddedScriptCheck._compileError(EmbeddedScriptCheck._cooked(node));
      if (problem) out.push(EmbeddedScriptCheck._diagnostic(node, problem));
    }
    return out;
  }

  static _scriptTemplates(ast) {
    const found = new Set();
    EmbeddedScriptCheck._walk(ast, (node) => {
      if (node.type === 'CallExpression' && EmbeddedScriptCheck._isRunner(node.callee)) {
        for (const arg of node.arguments) if (arg.type === 'TemplateLiteral') found.add(arg);
      }
      if (node.type === 'TemplateLiteral' && EmbeddedScriptCheck._looksLikeScript(node)) found.add(node);
    });
    return [...found];
  }

  static _isRunner(callee) {
    const name = callee && (callee.type === 'MemberExpression' ? callee.property && callee.property.name : callee.name);
    return EmbeddedScriptCheck.RUNNER_NAMES.has(name);
  }

  static _looksLikeScript(node) {
    const head = node.quasis[0] && node.quasis[0].value.cooked;
    const text = EmbeddedScriptCheck._cooked(node);
    return typeof head === 'string' && text.length >= EmbeddedScriptCheck.MIN_CHARS && EmbeddedScriptCheck.SCRIPT_START.test(head);
  }

  static _cooked(node) {
    let s = '';
    node.quasis.forEach((q, i) => {
      s += q.value.cooked != null ? q.value.cooked : q.value.raw;
      if (i < node.expressions.length) s += EmbeddedScriptCheck.PLACEHOLDER;
    });
    return s;
  }

  static _compileError(source) {
    try {
      require('espree').parse(source, { ecmaVersion: 'latest', sourceType: 'script' });
      return null;
    } catch (err) {
      return { line: err.lineNumber || 1, message: String(err.message || err).replace(/^Line \d+: /, '') };
    }
  }

  static _diagnostic(node, problem) {
    const line = node.loc.start.line + problem.line - 1;
    return {
      line,
      column: 1,
      severity: 'error',
      message: `The script in this template literal (line ${node.loc.start.line}) is not valid JavaScript once its `
        + `escapes are applied: ${problem.message} (its line ${problem.line}). Inside a template literal '\\n' becomes `
        + 'a real newline, so a string like \'\\n\' in the embedded script breaks. Write the page code as a real '
        + 'function and send `(${fn.toString()})()`, or escape it as \\\\n.',
      ruleId: 'embedded-script',
      source: 'embedded-script',
    };
  }

  static _walk(node, visit) {
    if (!node || typeof node.type !== 'string') return;
    visit(node);
    for (const key of Object.keys(node)) {
      if (key === 'parent' || key === 'loc' || key === 'range') continue;
      const value = node[key];
      if (Array.isArray(value)) { for (const child of value) EmbeddedScriptCheck._walk(child, visit); }
      else if (value && typeof value.type === 'string') EmbeddedScriptCheck._walk(value, visit);
    }
  }
}

module.exports = EmbeddedScriptCheck;
