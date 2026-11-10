class DigDeeper {
  static SETTINGS_K = 6;
  static CONVERSATIONS_K = 4;
  static DOCS_K = 4;
  static MIN_CONVERSATION_SCORE = 0.5;
  static EXCERPT_CHARS = 700;
  static TIMEOUT_MS = 120000;

  static SYSTEM = [
    'You are the search assistant built into LumaBrowser, a desktop web browser with a local AI chat.',
    'The user typed a question or a vague description into the app\'s search box. Answer it from the MATERIAL only:',
    'settings of the app [S#], the user\'s own past conversations [C#] and the app\'s documentation [D#].',
    'Be brief: at most 120 words, plain sentences or a short list, no headings.',
    'Put the tag of each item you rely on right after the fact, like [S2] or [C1]. Only use tags that appear in the material.',
    'When the user wants to change something, name the setting and where it is; do not invent settings.',
    'If the material does not answer the question, say so in one sentence and suggest what to search for instead.',
  ].join(' ');

  constructor({ settings, conversations, docs = null, getRouter = () => null }) {
    this._settings = settings;
    this._conversations = conversations;
    this._docs = docs;
    this._getRouter = getRouter;
    this._active = null;
  }

  async start(query, emit, owner = null) {
    this.abort();
    const token = { owner, handle: null };
    this._active = token;
    const live = (fn) => (...a) => { if (this._active === token) fn(...a); };
    const q = String(query || '').trim().slice(0, 500);
    if (!q) { this._active = null; emit('error', { message: 'Type a question first.' }); return; }
    const material = await this.gather(q);
    if (this._active !== token) return;
    emit('context', { chips: material.chips });
    const router = this._getRouter();
    if (!router || typeof router.completeStream !== 'function') {
      this._active = null;
      emit('error', { message: 'The chat model is not available yet.', noModel: true });
      return;
    }
    const handle = router.completeStream({
      messages: [
        { role: 'system', content: DigDeeper.SYSTEM },
        { role: 'user', content: `${material.text}\n\nQUESTION: ${q}` },
      ],
      temperature: 0.2,
      noThink: true,
      timeoutMs: DigDeeper.TIMEOUT_MS,
    }, {
      onDelta: live((t) => emit('delta', { text: t })),
      onDone: live((full) => { this._active = null; emit('done', { text: full }); }),
      onError: live((e) => {
        this._active = null;
        const message = (e && e.message) || 'The model could not answer.';
        emit('error', { message, noModel: /no model configured/i.test(message) });
      }),
    });
    token.handle = handle;
  }

  abort(owner) {
    const active = this._active;
    if (!active || (owner !== undefined && active.owner !== owner)) return;
    this._active = null;
    try { if (active && active.handle) active.handle.abort(); } catch (_) {}
  }

  async gather(query) {
    const chips = [];
    const lines = ['MATERIAL'];
    const settings = this._safe(() => this._settings.search(query, { limit: DigDeeper.SETTINGS_K }));
    if (settings.length) lines.push('', 'Settings:');
    settings.forEach((item, i) => {
      const tag = `S${i + 1}`;
      chips.push({ tag, item });
      lines.push(`[${tag}] ${item.title} (${item.subtitle})${item.value ? ` [currently: ${item.value}]` : ''}: ${item.detail || ''}`.trim());
    });
    const convs = this._safe(() => this._conversations.search(query, { limit: DigDeeper.CONVERSATIONS_K }))
      .filter((c) => (c.score || 0) >= DigDeeper.MIN_CONVERSATION_SCORE);
    if (convs.length) lines.push('', 'Past conversations:');
    convs.forEach((item, i) => {
      const tag = `C${i + 1}`;
      chips.push({ tag, item });
      lines.push(`[${tag}] "${item.title}": ${item.subtitle || ''}`);
    });
    const docs = await this._docPassages(query);
    if (docs.length) lines.push('', 'Documentation:');
    docs.forEach((d, i) => lines.push(`[D${i + 1}] ${d.name}: ${d.text}`));
    if (!settings.length && !convs.length && !docs.length) lines.push('', '(nothing matched)');
    return { text: lines.join('\n'), chips };
  }

  async _docPassages(query) {
    if (!this._docs || typeof this._docs.search !== 'function') return [];
    try {
      const r = await this._docs.search(query, { k: DigDeeper.DOCS_K });
      if (!r || !r.found) return [];
      return (r.sources || []).map((s) => ({
        name: (s.document && s.document.name) || 'docs',
        text: String((s.excerpt && s.excerpt.text) || '').slice(0, DigDeeper.EXCERPT_CHARS),
      }));
    } catch (_) {
      return [];
    }
  }

  _safe(fn) {
    try { return fn() || []; } catch (_) { return []; }
  }
}

module.exports = DigDeeper;
