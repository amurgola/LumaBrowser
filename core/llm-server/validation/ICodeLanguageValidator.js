class ICodeLanguageValidator {
  static SEVERITIES = ['error', 'warning', 'info'];

  get name() {
    throw new Error(`${this.constructor.name} must implement get name()`);
  }

  get languages() {
    throw new Error(`${this.constructor.name} must implement get languages()`);
  }

  validate(code, context) {
    throw new Error(`${this.constructor.name} must implement validate(code, context)`);
  }
}

module.exports = ICodeLanguageValidator;
