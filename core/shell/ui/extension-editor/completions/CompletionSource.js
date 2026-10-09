export default class CompletionSource {
  suggest(_ctx) {
    throw new Error(`${this.constructor.name} must implement suggest(ctx)`);
  }

  static matches(label, prefix) {
    return !prefix || String(label).toLowerCase().startsWith(prefix);
  }

  static snippet(ctx, fields) {
    return { ...fields, insertTextRules: ctx.monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet };
  }
}
