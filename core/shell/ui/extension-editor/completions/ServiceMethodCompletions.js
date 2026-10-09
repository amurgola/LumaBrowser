import CompletionSource from './CompletionSource.js';

export default class ServiceMethodCompletions extends CompletionSource {
  static SERVICE_RE = /\b(db|browser|llm|ipc|events|logger|sharedServices)\.(\w*)$/;
  static METHOD_LINE_RE = /^\s*(\w+)\s*[(-]/;

  suggest(ctx) {
    const m = ctx.text.match(ServiceMethodCompletions.SERVICE_RE);
    if (!m || !ctx.data.contextProperties) return [];
    const [, serviceName, typed] = m;
    const prop = ctx.data.contextProperties.find((p) => p.label === serviceName);
    if (!prop) return [];
    const prefix = typed.toLowerCase();
    return ServiceMethodCompletions.methodLines(prop.documentation)
      .filter(({ name }) => CompletionSource.matches(name, prefix))
      .map(({ name, line }) => CompletionSource.snippet(ctx, {
        label: name,
        kind: ctx.monaco.languages.CompletionItemKind.Method,
        insertText: name + '()',
        detail: `${serviceName}.${name}`,
        documentation: line,
      }));
  }

  static methodLines(documentation) {
    const lines = String(documentation || '').split('\n');
    const start = lines.findIndex((l) => l.includes('Methods:'));
    if (start < 0) return [];
    const out = [];
    for (let i = start + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith('Properties:')) break;
      const m = line.match(ServiceMethodCompletions.METHOD_LINE_RE);
      if (m) out.push({ name: m[1], line });
    }
    return out;
  }
}
