const ICodeLanguageValidator = require('../ICodeLanguageValidator');
const PowerShellGrammar = require('./PowerShellGrammar');
const PowerShellSyntaxCollector = require('./PowerShellSyntaxCollector');

class PowerShellValidator extends ICodeLanguageValidator {
  static MAX_BYTES = 2 * 1024 * 1024;

  get name() { return 'powershell'; }

  get languages() { return ['powershell']; }

  async validate(code) {
    const text = String(code == null ? '' : code);
    if (!PowerShellValidator._worthParsing(text)) return [];
    const parser = await PowerShellGrammar.createParser();
    let tree = null;
    try {
      tree = parser.parse(text);
      return tree.rootNode.hasError ? PowerShellSyntaxCollector.collect(tree.rootNode, this.name) : [];
    } finally {
      PowerShellValidator._free(tree, parser);
    }
  }

  static _worthParsing(text) {
    return text.trim().length > 0 && Buffer.byteLength(text, 'utf8') <= PowerShellValidator.MAX_BYTES;
  }

  static _free(tree, parser) {
    if (tree) { try { tree.delete(); } catch (_) {} }
    try { parser.delete(); } catch (_) {}
  }
}

module.exports = PowerShellValidator;
