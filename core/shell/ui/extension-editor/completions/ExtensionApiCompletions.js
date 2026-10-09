import CompletionSource from './CompletionSource.js';

export default class ExtensionApiCompletions extends CompletionSource {
  suggest(ctx) {
    const m = ctx.text.match(/context\.extensions\.(\w*)$/);
    if (!m || !ctx.data.extensionApis) return [];
    const prefix = m[1].toLowerCase();
    const kind = ctx.monaco.languages.CompletionItemKind.Value;
    return Object.entries(ctx.data.extensionApis)
      .filter(([extId]) => CompletionSource.matches(extId, prefix))
      .map(([extId, info]) => ({
        label: extId,
        kind,
        insertText: extId,
        detail: info.name || extId,
        documentation: info.description || `Extension: ${extId}`,
      }));
  }
}
