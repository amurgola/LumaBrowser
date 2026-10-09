import CompletionKinds from './CompletionKinds.js';
import CompletionSource from './CompletionSource.js';

export default class DependencyShortcutCompletions extends CompletionSource {
  suggest(ctx) {
    const deps = ctx.data.contextHints && ctx.data.contextHints.extensionDependencies;
    const m = deps ? ctx.text.match(/\b(\w+)\.(\w*)$/) : null;
    if (!m) return [];
    const [, varName, typed] = m;
    const prefix = typed.toLowerCase();
    const out = [];
    for (const dep of deps) {
      const api = ctx.data.extensionApis && ctx.data.extensionApis[dep.id];
      if (varName !== DependencyShortcutCompletions.camelCase(dep.id) || !api) continue;
      for (const method of api.methods || []) {
        if (!CompletionSource.matches(method.label, prefix)) continue;
        out.push(CompletionSource.snippet(ctx, {
          label: method.label,
          kind: CompletionKinds.map(ctx.monaco, method.kind),
          insertText: method.label + '()',
          detail: `${dep.name}.${method.label}`,
          documentation: method.documentation,
        }));
      }
    }
    return out;
  }

  static camelCase(id) {
    return String(id).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  }
}
