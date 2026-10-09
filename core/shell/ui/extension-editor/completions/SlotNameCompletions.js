import CompletionSource from './CompletionSource.js';

export default class SlotNameCompletions extends CompletionSource {
  static SLOTS = ['settings-tab', 'right-sidebar', 'toolbar-button', 'toolbar-buttons-right', 'bottom-bar', 'right-panel'];
  static REGISTER_RE = /slotManager\.register\(\s*["']([\w-]*)$/;

  suggest(ctx) {
    if (ctx.fileName !== 'renderer.js') return [];
    const m = ctx.text.match(SlotNameCompletions.REGISTER_RE);
    if (!m) return [];
    const typed = m[1];
    const range = SlotNameCompletions._typedRange(ctx, typed);
    const kind = ctx.monaco.languages.CompletionItemKind.Value;
    return SlotNameCompletions.SLOTS
      .filter((slot) => CompletionSource.matches(slot, typed.toLowerCase()))
      .map((slot) => ({
        label: slot,
        kind,
        insertText: slot,
        detail: 'UI slot',
        documentation: `Mounts into the ${slot} slot`,
        range,
      }));
  }

  static _typedRange(ctx, typed) {
    if (!ctx.position) return undefined;
    const { lineNumber, column } = ctx.position;
    return { startLineNumber: lineNumber, endLineNumber: lineNumber, startColumn: column - typed.length, endColumn: column };
  }
}
