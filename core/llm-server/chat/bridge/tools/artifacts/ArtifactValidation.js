const CodeValidator = require('../../../../validation/CodeValidator');

class ArtifactValidation {
  static INJECTED_NAMES = ['root', 'R', 'Chart'];
  static REDECLARED = /(?:^|[;\n{}]|=>)\s*(?:let|const|var)\s+(root|R|Chart)\b/;
  static MAX_SYNTAX_LINES = 5;

  static async codeNote(artifact) {
    if (!artifact || artifact.type !== 'code') return '';
    try {
      const v = await CodeValidator.validate({ language: artifact.language, filename: artifact.title, content: artifact.content });
      if (!v.supported || v.diagnostics.length === 0) return '';
      const block = CodeValidator.formatForModel(v);
      return v.ok ? `\n\n${block}` : `\n\n${block}\n(Fix these with edit_artifact before telling the user the code is done.)`;
    } catch (_) {
      return '';
    }
  }

  static async liveNote(js) {
    const code = js == null ? '' : String(js);
    if (!code.trim()) return '';
    try {
      const v = await ArtifactValidation._lint(code);
      if (!v.supported || v.diagnostics.length === 0) return '';
      const block = CodeValidator.formatForModel(v);
      return v.ok
        ? `\n\n${block}`
        : `\n\n${block}\n(The module's JS has the issue(s) above; fix them with edit_artifact before telling the user it's ready.)`;
    } catch (_) {
      return '';
    }
  }

  static async liveFatalError(js) {
    const code = js == null ? '' : String(js);
    if (!code.trim()) return null;
    const dup = ArtifactValidation.redeclaredInjectedName(code);
    if (dup) {
      return `The JS redeclares "${dup}", but root, R, and Chart are ALREADY provided to your code as variables; that throws "Identifier '${dup}' has already been declared" and the module would not run. Remove the let/const/var for ${dup} (use it directly, or don't reference it), then re-issue.`;
    }
    return ArtifactValidation._syntaxError(code);
  }

  static redeclaredInjectedName(code) {
    const m = String(code || '').match(ArtifactValidation.REDECLARED);
    return m ? m[1] : null;
  }

  static async _syntaxError(code) {
    try {
      const v = await ArtifactValidation._lint(code);
      if (!v.supported || v.ok) return null;
      const syntax = (v.diagnostics || []).filter(
        (d) => d.ruleId === 'syntax' || /parsing error|unexpected token|already been declared/i.test(d.message || ''));
      if (!syntax.length) return null;
      const lines = syntax.slice(0, ArtifactValidation.MAX_SYNTAX_LINES).map((d) => `  • line ${d.line}: ${d.message}`).join('\n');
      return `The module's JS has a syntax error, so it would not run:\n${lines}\nFix the syntax and re-issue.`;
    } catch (_) {
      return null;
    }
  }

  static _lint(code) {
    return CodeValidator.validate({ language: 'javascript', filename: 'module.js', content: code });
  }
}

module.exports = ArtifactValidation;
