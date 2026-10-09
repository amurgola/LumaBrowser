const ICodeLanguageValidator = require('../ICodeLanguageValidator');

class JavaScriptValidator extends ICodeLanguageValidator {
  static GLOBALS = {
    console: 'readonly', process: 'readonly', require: 'readonly',
    module: 'writable', exports: 'writable', __dirname: 'readonly',
    __filename: 'readonly', Buffer: 'readonly', global: 'readonly',
    globalThis: 'readonly', window: 'readonly', document: 'readonly',
    fetch: 'readonly', URL: 'readonly', setTimeout: 'readonly',
    clearTimeout: 'readonly', setInterval: 'readonly', clearInterval: 'readonly',
  };

  static RULE_OVERRIDES = {
    'no-undef': 'off',
    'no-unused-vars': 'warn',
    'no-empty': 'warn',
    'no-constant-condition': 'warn',
    'no-dupe-keys': 'error',
    'no-dupe-args': 'error',
    'no-unreachable': 'warn',
    'no-cond-assign': 'warn',
  };

  get name() { return 'eslint'; }

  get languages() { return ['javascript', 'jsx']; }

  validate(code, context) {
    const jsx = !!(context && context.language === 'jsx');
    const rules = JavaScriptValidator._rules();
    const messages = JavaScriptValidator._lintPreferringFewerFatals(code, jsx, rules);
    return messages.map((message) => this._toDiagnostic(message));
  }

  _toDiagnostic(message) {
    return {
      line: message.line || 1,
      column: message.column || 1,
      endLine: message.endLine,
      endColumn: message.endColumn,
      severity: (message.fatal || message.severity === 2) ? 'error' : 'warning',
      message: message.message,
      ruleId: message.ruleId || (message.fatal ? 'syntax' : null),
      source: this.name,
    };
  }

  static _rules() {
    return { ...JavaScriptValidator._recommendedRules(), ...JavaScriptValidator.RULE_OVERRIDES };
  }

  static _recommendedRules() {
    try {
      return require('@eslint/js').configs.recommended.rules || {};
    } catch (_) {
      return {};
    }
  }

  static _lintPreferringFewerFatals(code, jsx, rules) {
    const { Linter } = require('eslint');
    const linter = new Linter();
    const asModule = JavaScriptValidator._lint(linter, code, 'module', jsx, rules);
    const moduleFatals = JavaScriptValidator._fatalCount(asModule);
    if (moduleFatals === 0) return asModule;
    const asScript = JavaScriptValidator._lint(linter, code, 'commonjs', jsx, rules);
    return JavaScriptValidator._fatalCount(asScript) < moduleFatals ? asScript : asModule;
  }

  static _lint(linter, code, sourceType, jsx, rules) {
    const config = {
      languageOptions: {
        ecmaVersion: 'latest',
        sourceType,
        globals: JavaScriptValidator.GLOBALS,
        parserOptions: { ecmaFeatures: { jsx } },
      },
      rules,
    };
    try {
      return linter.verify(code, config);
    } catch (error) {
      return [{ fatal: true, severity: 2, line: 1, column: 1, message: 'ESLint could not parse the source: ' + error.message }];
    }
  }

  static _fatalCount(messages) {
    return messages.filter((m) => m.fatal).length;
  }
}

module.exports = JavaScriptValidator;
