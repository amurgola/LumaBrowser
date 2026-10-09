import CompletionKinds from './CompletionKinds.js';
import CompletionSource from './CompletionSource.js';

export default class ContextPropertyCompletions extends CompletionSource {
  suggest(ctx) {
    const m = ctx.text.match(/context\.(\w*)$/);
    if (!m || !ctx.data.contextProperties) return [];
    const prefix = m[1].toLowerCase();
    return ctx.data.contextProperties
      .filter((prop) => CompletionSource.matches(prop.label, prefix))
      .map((prop) => CompletionSource.snippet(ctx, {
        label: prop.label,
        kind: CompletionKinds.map(ctx.monaco, prop.kind),
        insertText: prop.label,
        detail: prop.detail,
        documentation: prop.documentation,
      }));
  }
}
