export default class ToolCompletions {
  static register(monaco, tool) {
    return monaco.languages.registerCompletionItemProvider('javascript', {
      triggerCharacters: ['.'],
      provideCompletionItems: (model, position) => ({
        suggestions: ToolCompletions.suggest(monaco, tool, ToolCompletions._lineBefore(model, position), ToolCompletions._range(model, position)),
      }),
    });
  }

  static suggest(monaco, tool, line, range) {
    const item = ToolCompletions._itemFactory(monaco, range);
    const K = monaco.languages.CompletionItemKind;
    if (/\bctx\.config\.$/.test(line)) return ToolCompletions._configItems(tool, item, K);
    if (/\bctx\.luma\.$/.test(line)) return ToolCompletions._lumaItems(item, K);
    if (/\bctx\.$/.test(line)) return ToolCompletions._ctxItems(item, K);
    if (/\bargs\.$/.test(line)) return ToolCompletions._argItems(tool, item, K);
    return [];
  }

  static argNames(inputSchema) {
    const props = inputSchema && inputSchema.properties;
    return props && typeof props === 'object' ? Object.keys(props) : [];
  }

  static _configItems(tool, item, K) {
    const slots = tool.configSlots || [];
    return slots.map((slot) => item(slot.key, K.Property, 'config' + (slot.secret ? ' (secret)' : ''), slot.description || slot.label || ''));
  }

  static _lumaItems(item, K) {
    return [
      item('fetchPage', K.Method, 'luma.fetchPage(params)', 'Fetch a page as markdown/text/html for scraping.', 'fetchPage({ url: $1 })', true),
      item('openTab', K.Method, 'luma.openTab(params)', 'Open a real browser tab for the user.', 'openTab({ url: $1 })', true),
    ];
  }

  static _ctxItems(item, K) {
    return [
      item('config', K.Property, 'Record<string,string>', 'Your declared config slots (API keys etc.).'),
      item('fetch', K.Method, 'fetch(url, options?) → { status, ok, body, headers, truncated }',
        'HTTP request restricted to your allowedHosts. body is a string; JSON.parse it yourself.', 'fetch($1)', true),
      item('luma', K.Property, '{ fetchPage, openTab }', 'Browser bridge for pages and tabs.'),
    ];
  }

  static _argItems(tool, item, K) {
    const props = (tool.inputSchema && tool.inputSchema.properties) || {};
    return ToolCompletions.argNames(tool.inputSchema).map((name) => {
      const p = props[name] || {};
      return item(name, K.Property, p.type ? String(p.type) : 'arg', p.description || '');
    });
  }

  static _itemFactory(monaco, range) {
    return (label, kind, detail, documentation, insertText, snippet) => ({
      label,
      kind,
      detail,
      documentation,
      range,
      insertText: insertText == null ? label : insertText,
      insertTextRules: snippet ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet : undefined,
    });
  }

  static _lineBefore(model, position) {
    return model.getValueInRange({
      startLineNumber: position.lineNumber, startColumn: 1,
      endLineNumber: position.lineNumber, endColumn: position.column,
    });
  }

  static _range(model, position) {
    const word = model.getWordUntilPosition(position);
    return {
      startLineNumber: position.lineNumber, endLineNumber: position.lineNumber,
      startColumn: word.startColumn, endColumn: word.endColumn,
    };
  }
}
