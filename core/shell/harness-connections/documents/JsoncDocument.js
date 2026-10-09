const { parseTree, getNodeValue, printParseErrorCode } = require('jsonc-parser');
const ConfigDocument = require('./ConfigDocument');
const JsoncSplicer = require('./JsoncSplicer');

class JsoncDocument extends ConfigDocument {
  static ID = 'jsonc';
  static LABEL = 'JSON';
  static EMPTY = '{}\n';

  _parse(text) {
    const problems = [];
    const root = parseTree(text, problems, { allowTrailingComma: true });
    if (problems.length) throw new Error(JsoncDocument._syntaxMessage(text, problems[0]));
    if (!root || root.type !== 'object') throw new Error('Expected a JSON object at the top level of the file.');
    return getNodeValue(root);
  }

  _textWith(path, value) {
    return new JsoncSplicer(this._text).set(path, value);
  }

  _textWithout(path) {
    return new JsoncSplicer(this._text).remove(path);
  }

  static _syntaxMessage(text, problem) {
    const line = text.slice(0, problem.offset).split('\n').length;
    return `JSON syntax error on line ${line}: ${printParseErrorCode(problem.error)}.`;
  }
}

module.exports = JsoncDocument;
