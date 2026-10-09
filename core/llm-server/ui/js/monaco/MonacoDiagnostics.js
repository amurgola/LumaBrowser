export default class MonacoDiagnostics {
  static IGNORED_CODES = [2307, 2304, 2305, 2306, 2503, 2552, 2580, 2686, 2691,
    2792, 2874, 2875, 2876, 7016, 7026, 1378, 1208];

  static _configured = false;

  static configure(monaco) {
    if (MonacoDiagnostics._configured || !monaco || !monaco.languages) return;
    MonacoDiagnostics._configured = true;
    MonacoDiagnostics._configureTypeScript(monaco.languages.typescript);
    MonacoDiagnostics._configureJson(monaco.languages);
    MonacoDiagnostics._configureCss(monaco.languages);
  }

  static _configureTypeScript(tsApi) {
    if (!tsApi) return;
    const compiler = MonacoDiagnostics._compilerOptions(tsApi);
    const ignore = MonacoDiagnostics.IGNORED_CODES;
    try {
      tsApi.typescriptDefaults.setCompilerOptions(compiler);
      tsApi.javascriptDefaults.setCompilerOptions(compiler);
      tsApi.typescriptDefaults.setDiagnosticsOptions(
        { noSemanticValidation: false, noSyntaxValidation: false, diagnosticCodesToIgnore: ignore });
      tsApi.javascriptDefaults.setDiagnosticsOptions(
        { noSemanticValidation: true, noSyntaxValidation: false, diagnosticCodesToIgnore: ignore });
    } catch (_) {}
  }

  static _compilerOptions(tsApi) {
    return {
      allowNonTsExtensions: true,
      allowJs: true,
      target: tsApi.ScriptTarget ? tsApi.ScriptTarget.ESNext : 99,
      module: tsApi.ModuleKind ? tsApi.ModuleKind.ESNext : 99,
      jsx: tsApi.JsxEmit ? tsApi.JsxEmit.React : undefined,
      noEmit: true,
    };
  }

  static _configureJson(languages) {
    try {
      if (languages.json && languages.json.jsonDefaults) {
        languages.json.jsonDefaults.setDiagnosticsOptions({ validate: true, allowComments: true, schemaValidation: 'warning' });
      }
    } catch (_) {}
  }

  static _configureCss(languages) {
    try {
      if (languages.css && languages.css.cssDefaults) languages.css.cssDefaults.setOptions({ validate: true });
    } catch (_) {}
  }

  static reset() {
    MonacoDiagnostics._configured = false;
  }
}
