import CompletionSource from './CompletionSource.js';

export default class CssClassCompletions extends CompletionSource {
  static STYLE_FILE_RE = /\.?(\w*)$/;
  static CLASS_ATTR_RE = /class="?\s*\.?(\w*)$/;

  suggest(ctx) {
    const pattern = CssClassCompletions._patternFor(ctx.fileName);
    const m = pattern ? ctx.text.match(pattern) : null;
    if (!m || !ctx.data.cssClasses) return [];
    const prefix = m[1].toLowerCase();
    const kind = ctx.monaco.languages.CompletionItemKind.Class;
    return ctx.data.cssClasses
      .filter((cls) => CompletionSource.matches(cls.label, prefix))
      .map((cls) => ({
        label: cls.label,
        kind,
        insertText: cls.label,
        detail: cls.detail,
        documentation: cls.detail,
      }));
  }

  static _patternFor(fileName) {
    if (fileName.endsWith('.css') || fileName.endsWith('.html')) return CssClassCompletions.STYLE_FILE_RE;
    if (fileName.endsWith('.js')) return CssClassCompletions.CLASS_ATTR_RE;
    return null;
  }
}
