const ChatStyleDocs = require('./ChatStyleDocs');

class DocsSourceGrant {
  static TOOL = 'search_lumabrowser_docs';
  static SOURCE_ID = 'lumabrowser-documentation';
  static PREPASS_K = 4;
  static MAX_QUERY_CHARS = 2000;

  static NOTE = [
    'The user attached the LumaBrowser documentation (the manual of this very app: its features, settings, chat',
    'tools, extensions API, build and internals) as a source for this conversation. Before answering anything',
    `about LumaBrowser itself, call ${'search_lumabrowser_docs'} with a focused query and ground your answer in the`,
    'passages it returns, naming the page (source) you drew from. If they do not cover the question, say so.',
  ].join(' ');

  static DESCRIPTION = 'Search the LumaBrowser documentation (this app\'s own manual: features, settings, chat tools, '
    + 'the extension and dashboard APIs, build and internals) for passages relevant to a question. Returns '
    + 'passages tagged [S1], [S2], ... with their page to ground the answer in; one focused query is usually enough.';

  static forTurn(docs, on) {
    if (on !== true || !docs || !docs.available()) return null;
    return new DocsSourceGrant(docs);
  }

  constructor(docs) {
    this._docs = docs;
  }

  get extraTool() {
    return {
      name: DocsSourceGrant.TOOL,
      description: DocsSourceGrant.DESCRIPTION,
      inputSchema: {
        type: 'object',
        properties: { query: { type: 'string', description: 'What to look for in the documentation.' } },
        required: ['query'],
      },
      handler: (params, ctx) => this._search(params, ctx),
    };
  }

  get note() {
    return DocsSourceGrant.NOTE;
  }

  static allowing(allowedTools, grant) {
    if (!grant || !Array.isArray(allowedTools) || allowedTools.includes(DocsSourceGrant.TOOL)) return allowedTools;
    return [...allowedTools, DocsSourceGrant.TOOL];
  }

  async prepass(messages) {
    const query = DocsSourceGrant._lastUserText(messages);
    if (!query) return messages;
    const res = await this._docs.search(query, { k: DocsSourceGrant.PREPASS_K });
    if (!res.found) return messages;
    return ChatStyleDocs.appendToSystemHead(messages, DocsSourceGrant._prepassDoc(res.rendered));
  }

  static _prepassDoc(rendered) {
    return '<lumabrowser_documentation>\n'
      + 'The user attached the LumaBrowser documentation (this app\'s own manual) as a source. These are the passages '
      + 'matching their message; answer from them, naming the page (source) you used, and say so when they do not '
      + 'cover the question.\n\n' + rendered + '\n</lumabrowser_documentation>';
  }

  static _lastUserText(messages) {
    for (let i = (messages || []).length - 1; i >= 0; i -= 1) {
      const m = messages[i];
      if (m && m.role === 'user' && typeof m.content === 'string' && m.content.trim()) {
        return m.content.trim().slice(-DocsSourceGrant.MAX_QUERY_CHARS);
      }
    }
    return '';
  }

  async _search(params, ctx) {
    const query = params && (params.query || params.q);
    const res = await this._docs.search(String(query || ''));
    if (res.found && res.sources && res.sources.length && ctx && typeof ctx.emit === 'function') {
      ctx.emit({ type: 'citations', payload: { sources: res.sources } });
    }
    return { success: true, found: res.found, message: DocsSourceGrant._message(res) };
  }

  static _message(res) {
    if (!res.found) return 'No passages in the LumaBrowser documentation matched that query. Try other words, or tell the user the documentation does not cover it.';
    const n = res.sources.length;
    return `Found ${n} relevant passage${n === 1 ? '' : 's'} in the LumaBrowser documentation. Use them to answer and name the source page:\n\n${res.rendered}`;
  }
}

module.exports = DocsSourceGrant;
