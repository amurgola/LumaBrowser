import CompletionKinds from './CompletionKinds.js';
import CompletionSource from './CompletionSource.js';

export default class RendererContextCompletions extends CompletionSource {
  suggest(ctx) {
    if (ctx.fileName !== 'renderer.js') return [];
    const m = ctx.text.match(/context\.(\w*)$/);
    if (!m || !ctx.data.rendererContext) return [];
    const prefix = m[1].toLowerCase();
    return ctx.data.rendererContext
      .filter((prop) => CompletionSource.matches(prop.label, prefix))
      .map((prop) => ({
        label: prop.label,
        kind: CompletionKinds.map(ctx.monaco, prop.kind),
        insertText: prop.label,
        detail: prop.detail,
        documentation: prop.documentation,
      }));
  }
}
