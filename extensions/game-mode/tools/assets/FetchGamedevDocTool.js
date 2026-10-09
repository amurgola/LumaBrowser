const GameTool = require('../GameTool');
const GameKnowledgeBase = require('../../GameKnowledgeBase');
const CoreRequire = require('../../CoreRequire');

class FetchGamedevDocTool extends GameTool {
  static TIMEOUT_MS = 20000;
  static MAX_CHARS = 60000;

  constructor(scope, { kbCacheDir }) {
    super(scope);
    this._kbCacheDir = kbCacheDir;
  }

  get name() { return 'fetch_gamedev_doc'; }

  get description() {
    return 'Fetch a game-development tutorial or documentation page from the web and add it to the '
      + 'game-dev knowledge base. After it succeeds, search_knowledge_base can answer from that page. Use '
      + 'this when you need technique details the knowledge base does not cover yet.';
  }

  get inputSchema() {
    return {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL of the tutorial or doc page' },
        note: { type: 'string', description: 'What you are looking for on it (optional)' },
      },
      required: ['url'],
    };
  }

  async run(params) {
    const url = params && String(params.url || '').trim();
    if (!/^https?:\/\//i.test(url)) return { success: false, error: 'url must be an http(s) URL' };
    const rag = GameKnowledgeBase.rag();
    if (!rag) return { success: false, error: 'knowledge base unavailable on this install' };
    const fetched = await FetchGamedevDocTool._fetch(url);
    if (fetched.error) return { success: false, error: fetched.error };
    try {
      await GameKnowledgeBase.ingestPage({ rag, url, text: fetched.message, cacheDir: this._kbCacheDir });
    } catch (e) {
      return { success: false, error: `Fetched the page but could not ingest it: ${e.message}` };
    }
    return {
      success: true,
      message: `Ingested ${url} (${String(fetched.message || '').length} chars) into the game-dev knowledge base. `
        + 'It is now searchable with search_knowledge_base.',
      summary: `${url} · ingested`,
    };
  }

  static async _fetch(url) {
    let read;
    try {
      const PageReader = CoreRequire.load('llm-server/chat/web-tools/PageReader');
      read = await PageReader.read(url, { timeoutMs: FetchGamedevDocTool.TIMEOUT_MS });
    } catch (e) {
      return { error: `Fetch failed: ${e.message}` };
    }
    if (!read || !read.success) return { error: (read && read.error) || `Could not fetch ${url}` };
    return { message: read.document.text.slice(0, FetchGamedevDocTool.MAX_CHARS) };
  }
}

module.exports = FetchGamedevDocTool;
