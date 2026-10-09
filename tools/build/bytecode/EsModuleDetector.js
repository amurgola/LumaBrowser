class EsModuleDetector {
  static IMPORT_LINE = /^[ \t]*import\s*(?:[\w$*{]|['"])/m;
  static EXPORT_LINE = /^[ \t]*export\s+(?:default\b|class\b|const\b|let\b|var\b|function\b|async\b|\{|\*)/m;
  static COMMONJS_EXPORT = /\bmodule\.exports\b|\bexports\.[\w$]+\s*=/;

  static isEsModule(source) {
    const text = String(source || '');
    if (!EsModuleDetector._hasModuleSyntax(text)) return false;
    return !EsModuleDetector.COMMONJS_EXPORT.test(text);
  }

  static _hasModuleSyntax(text) {
    return EsModuleDetector.IMPORT_LINE.test(text) || EsModuleDetector.EXPORT_LINE.test(text);
  }
}

module.exports = EsModuleDetector;
