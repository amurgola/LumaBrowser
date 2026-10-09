const ICodeLanguageValidator = require('../ICodeLanguageValidator');

class TypeScriptValidator extends ICodeLanguageValidator {
  static IGNORED_CODES = new Set([
    2307, 2304, 2305, 2306, 2503, 2552, 2580, 2686, 2691, 2792,
    2875, 2874, 2876, 7016, 7026, 1378, 1208,
  ]);

  get name() { return 'typescript'; }

  get languages() { return ['typescript', 'tsx']; }

  validate(code, context) {
    const ts = require('typescript');
    const tsx = !!(context && context.language === 'tsx');
    const { program, sourceFile } = TypeScriptValidator._createProgram(ts, code, tsx);
    return TypeScriptValidator._collectDiagnostics(program, sourceFile)
      .filter((d) => !TypeScriptValidator.IGNORED_CODES.has(d.code))
      .map((d) => this._toDiagnostic(ts, d));
  }

  _toDiagnostic(ts, diagnostic) {
    const { line, column } = TypeScriptValidator._position(diagnostic);
    return {
      line,
      column,
      severity: TypeScriptValidator._severity(ts, diagnostic.category),
      message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
      ruleId: 'TS' + diagnostic.code,
      source: this.name,
    };
  }

  static _createProgram(ts, code, tsx) {
    const fileName = tsx ? 'artifact.tsx' : 'artifact.ts';
    const options = TypeScriptValidator._compilerOptions(ts, tsx);
    const sourceFile = ts.createSourceFile(fileName, code, options.target, true, tsx ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    const host = TypeScriptValidator._inMemoryHost(ts, options, fileName, sourceFile);
    return { program: ts.createProgram([fileName], options, host), sourceFile };
  }

  static _compilerOptions(ts, tsx) {
    return {
      noEmit: true, allowJs: true, checkJs: false, noResolve: true,
      skipLibCheck: true, strict: false, types: [],
      target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext,
      jsx: tsx ? ts.JsxEmit.ReactJSX : undefined,
    };
  }

  static _inMemoryHost(ts, options, fileName, sourceFile) {
    const host = ts.createCompilerHost(options, true);
    const readFromDisk = host.getSourceFile.bind(host);
    host.getSourceFile = (name, languageVersion, onError) => (
      name === fileName ? sourceFile : readFromDisk(name, languageVersion, onError));
    host.writeFile = () => {};
    return host;
  }

  static _collectDiagnostics(program, sourceFile) {
    return [
      ...program.getSyntacticDiagnostics(sourceFile),
      ...program.getSemanticDiagnostics(sourceFile),
    ];
  }

  static _position(diagnostic) {
    if (!diagnostic.file || typeof diagnostic.start !== 'number') return { line: 1, column: 1 };
    const point = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
    return { line: point.line + 1, column: point.character + 1 };
  }

  static _severity(ts, category) {
    if (category === ts.DiagnosticCategory.Error) return 'error';
    if (category === ts.DiagnosticCategory.Warning) return 'warning';
    return 'info';
  }
}

module.exports = TypeScriptValidator;
