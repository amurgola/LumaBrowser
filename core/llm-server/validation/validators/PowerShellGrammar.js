class PowerShellGrammar {
  static _ready = null;

  static load() {
    if (!PowerShellGrammar._ready) {
      PowerShellGrammar._ready = PowerShellGrammar._initialize().catch((error) => {
        PowerShellGrammar._ready = null;
        throw error;
      });
    }
    return PowerShellGrammar._ready;
  }

  static async createParser() {
    const { Parser, language } = await PowerShellGrammar.load();
    const parser = new Parser();
    parser.setLanguage(language);
    return parser;
  }

  static async _initialize() {
    const { Parser, Language } = require('web-tree-sitter');
    await Parser.init();
    const language = await Language.load(await PowerShellGrammar._readGrammarBytes());
    return { Parser, language };
  }

  static _readGrammarBytes() {
    const fs = require('fs');
    return fs.promises.readFile(require.resolve('tree-sitter-powershell/tree-sitter-powershell.wasm'));
  }
}

module.exports = PowerShellGrammar;
