export default class MonacoThemes {
  static THEME_ID = 'luma-dark';

  static RULES = [
    { token: '', foreground: 'e6e9f2' },
    { token: 'comment', foreground: '5b6478', fontStyle: 'italic' },
    { token: 'keyword', foreground: 'c792ea' },
    { token: 'keyword.control', foreground: 'c792ea' },
    { token: 'operator', foreground: '89ddff' },
    { token: 'delimiter', foreground: '8a95ad' },
    { token: 'string', foreground: '9ece6a' },
    { token: 'string.escape', foreground: '89ddff' },
    { token: 'regexp', foreground: 'f7768e' },
    { token: 'number', foreground: 'f59e0b' },
    { token: 'constant', foreground: 'f59e0b' },
    { token: 'type', foreground: '2dd4bf' },
    { token: 'type.identifier', foreground: '2dd4bf' },
    { token: 'namespace', foreground: '2dd4bf' },
    { token: 'function', foreground: '7aa2f7' },
    { token: 'identifier', foreground: 'e6e9f2' },
    { token: 'variable', foreground: 'e6c07b' },
    { token: 'variable.predefined', foreground: 'f7768e' },
    { token: 'tag', foreground: '7aa2f7' },
    { token: 'metatag', foreground: '7aa2f7' },
    { token: 'attribute.name', foreground: 'f59034' },
    { token: 'attribute.value', foreground: '9ece6a' },
    { token: 'annotation', foreground: 'f59034' },
    { token: 'key', foreground: '7aa2f7' },
    { token: 'string.key', foreground: '7aa2f7' },
    { token: 'string.value', foreground: '9ece6a' },
  ];

  static COLORS = {
    'editor.background': '#0b1220',
    'editor.foreground': '#e6e9f2',
    'editorGutter.background': '#0b1220',
    'editorLineNumber.foreground': '#39404f',
    'editorLineNumber.activeForeground': '#8a95ad',
    'editorCursor.foreground': '#f59034',
    'editor.selectionBackground': '#26314f',
    'editor.selectionHighlightBackground': '#26314f66',
    'editor.lineHighlightBackground': '#111a2b',
    'editor.findMatchBackground': '#f5903455',
    'editor.findMatchHighlightBackground': '#f5903433',
    'editorBracketMatch.background': '#26314f',
    'editorBracketMatch.border': '#f59034',
    'editorWidget.background': '#121a2b',
    'editorWidget.border': '#2a3550',
    'editorWidget.foreground': '#e6e9f2',
    'input.background': '#0b1220',
    'input.border': '#2a3550',
    'scrollbarSlider.background': '#f5903426',
    'scrollbarSlider.hoverBackground': '#f590344d',
    'scrollbarSlider.activeBackground': '#f590344d',
  };

  static _defined = false;

  static define(monaco) {
    if (MonacoThemes._defined || !monaco || !monaco.editor || !monaco.editor.defineTheme) return;
    MonacoThemes._defined = true;
    monaco.editor.defineTheme(MonacoThemes.THEME_ID, {
      base: 'vs-dark',
      inherit: true,
      rules: MonacoThemes.RULES,
      colors: MonacoThemes.COLORS,
    });
  }

  static reset() {
    MonacoThemes._defined = false;
  }
}
