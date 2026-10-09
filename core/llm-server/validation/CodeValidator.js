const JavaScriptValidator = require('./validators/JavaScriptValidator');
const TypeScriptValidator = require('./validators/TypeScriptValidator');
const JsonValidator = require('./validators/JsonValidator');
const PowerShellValidator = require('./validators/PowerShellValidator');
const ValidationResult = require('./ValidationResult');

class CodeValidator {
  static ALIASES = {
    js: 'javascript', javascript: 'javascript', mjs: 'javascript',
    cjs: 'javascript', node: 'javascript', jsx: 'jsx',
    ts: 'typescript', typescript: 'typescript', tsx: 'tsx',
    json: 'json', jsonc: 'jsonc', json5: 'jsonc',
    ps1: 'powershell', psm1: 'powershell', psd1: 'powershell',
    pwsh: 'powershell', powershell: 'powershell', posh: 'powershell',
  };

  static _registry = new Map();

  static register(validator) {
    if (!validator || typeof validator.validate !== 'function') {
      throw new Error('register() expects an ICodeLanguageValidator');
    }
    for (const language of validator.languages || []) CodeValidator._registry.set(language, validator);
    return validator;
  }

  static normalize(language, filename) {
    const canonical = CodeValidator._aliasFor(CodeValidator._extensionOrTag(language, filename));
    return CodeValidator._registry.has(canonical) ? canonical : null;
  }

  static isSupported(language, filename) {
    return CodeValidator.normalize(language, filename) !== null;
  }

  static supportedLanguages() {
    return Array.from(CodeValidator._registry.keys()).sort();
  }

  static async validate({ language, filename, content } = {}) {
    const key = CodeValidator.normalize(language, filename);
    if (!key) return ValidationResult.unsupported(language, filename);
    const validator = CodeValidator._registry.get(key);
    try {
      const diagnostics = await validator.validate(CodeValidator._text(content), { language: key, filename });
      return ValidationResult.fromDiagnostics(key, validator.name, Array.isArray(diagnostics) ? diagnostics : []);
    } catch (error) {
      return ValidationResult.crashed(key, validator.name, error);
    }
  }

  static formatForModel(result, options) {
    return ValidationResult.formatForModel(result, options);
  }

  static _extensionOrTag(language, filename) {
    let key = String(language || '').toLowerCase().trim();
    if (!key && filename) key = String(filename).toLowerCase().trim();
    return key.includes('.') ? key.split('.').pop().trim() : key;
  }

  static _aliasFor(key) {
    return CodeValidator.ALIASES[key] || key;
  }

  static _text(content) {
    return String(content == null ? '' : content);
  }

  static _registerBuiltIns() {
    CodeValidator.register(new JavaScriptValidator());
    CodeValidator.register(new TypeScriptValidator());
    CodeValidator.register(new JsonValidator());
    CodeValidator.register(new PowerShellValidator());
  }
}

CodeValidator._registerBuiltIns();

module.exports = CodeValidator;
