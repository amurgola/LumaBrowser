const ICodeLanguageValidator = require('../ICodeLanguageValidator');
const JsonCommentStripper = require('./JsonCommentStripper');

class JsonValidator extends ICodeLanguageValidator {
  get name() { return 'json'; }

  get languages() { return ['json', 'jsonc']; }

  validate(code, context) {
    const text = (context && context.language === 'jsonc') ? JsonCommentStripper.strip(code) : code;
    try {
      JSON.parse(text);
      return [];
    } catch (error) {
      return [this._toDiagnostic(error, text)];
    }
  }

  _toDiagnostic(error, text) {
    const message = String((error && error.message) || 'Invalid JSON');
    const { line, column } = JsonValidator.locateError(message, text);
    return { line, column, severity: 'error', message, ruleId: 'json-parse', source: this.name };
  }

  static locateError(message, text) {
    const lineColumn = message.match(/line (\d+) column (\d+)/i);
    if (lineColumn) return { line: Number(lineColumn[1]), column: Number(lineColumn[2]) };
    const position = message.match(/position (\d+)/i);
    if (position) return JsonValidator._lineColumnAt(String(text), Number(position[1]));
    return { line: 1, column: 1 };
  }

  static _lineColumnAt(text, offset) {
    let line = 1;
    let column = 1;
    for (let i = 0; i < offset && i < text.length; i++) {
      if (text[i] === '\n') { line += 1; column = 1; } else column += 1;
    }
    return { line, column };
  }
}

module.exports = JsonValidator;
