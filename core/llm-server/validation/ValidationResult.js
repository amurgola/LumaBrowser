class ValidationResult {
  static FORMAT_MAX = 25;

  static unsupported(language, filename) {
    const what = language || filename || 'this language';
    return {
      ok: true, supported: false, language: language || null,
      diagnostics: [], errors: 0, warnings: 0,
      summary: `No in-process validator for "${what}", skipped.`,
    };
  }

  static crashed(language, engine, error) {
    const message = (error && error.message) || error;
    return {
      ok: true, supported: true, language, engine,
      diagnostics: [], errors: 0, warnings: 0, error: String(message),
      summary: `Validator error (${language}): ${message}, skipped.`,
    };
  }

  static fromDiagnostics(language, engine, diagnostics) {
    const sorted = [...diagnostics].sort((a, b) => (a.line - b.line) || (a.column - b.column));
    const errors = ValidationResult._countSeverity(sorted, 'error');
    const warnings = ValidationResult._countSeverity(sorted, 'warning');
    return {
      ok: errors === 0, supported: true, language, engine,
      diagnostics: sorted, errors, warnings,
      summary: `${ValidationResult._plural(errors, 'error')}, ${ValidationResult._plural(warnings, 'warning')}`,
    };
  }

  static formatForModel(result, { max = ValidationResult.FORMAT_MAX } = {}) {
    if (!result) return '';
    if (!result.supported) return `VALIDATION: ${result.summary}`;
    if (!result.diagnostics.length) return `VALIDATION (${result.language}): clean, no issues found.`;
    const lines = result.diagnostics.slice(0, max).map(ValidationResult._formatDiagnostic);
    const more = result.diagnostics.length > max ? `\n  …and ${result.diagnostics.length - max} more.` : '';
    return `VALIDATION (${result.language}): ${result.summary}\n${lines.join('\n')}${more}`;
  }

  static _formatDiagnostic(diagnostic) {
    const rule = diagnostic.ruleId ? ` [${diagnostic.ruleId}]` : '';
    return `  L${diagnostic.line}:${diagnostic.column} ${diagnostic.severity} ${diagnostic.message}${rule}`;
  }

  static _countSeverity(diagnostics, severity) {
    return diagnostics.filter((d) => d.severity === severity).length;
  }

  static _plural(count, noun) {
    return `${count} ${noun}${count === 1 ? '' : 's'}`;
  }
}

module.exports = ValidationResult;
