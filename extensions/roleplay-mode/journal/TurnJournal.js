const HostGlobals = require('../HostGlobals');
const PromptBudget = require('../prompts/PromptBudget');
const ContextAudit = require('../lab/ContextAudit');
const JournalFiles = require('./JournalFiles');
const JournalMarkdown = require('./JournalMarkdown');
const TreeDigest = require('./TreeDigest');

class TurnJournal {
  static HISTORY_LINE = 110;
  static SIDE_KINDS = [
    { kind: 'stage (cast, place, wardrobe, events, clock, threads)', test: /stage manager/i },
    { kind: 'casting (a character profile)', test: /casting director/i },
    { kind: 'pressure (story editor)', test: /story editor/i },
    { kind: 'consolidation (character fold)', test: /character records of an interactive roleplay/i },
    { kind: 'consolidation (story summary)', test: /story record of an interactive roleplay/i },
    { kind: 'polish (line editor)', test: /line editor/i },
  ];

  static shared = new TurnJournal();

  constructor({ files = new JournalFiles(), router = () => HostGlobals.chatRouter(), now = () => Date.now(), version = TurnJournal.addOnVersion() } = {}) {
    this._files = files;
    this._router = router;
    this._now = now;
    this._version = version;
    this._on = new Map();
    this._observed = null;
    this._detach = null;
  }

  static addOnVersion() {
    try { return require('../manifest').version; } catch (_) { return ''; }
  }

  static enabled(data) {
    return !!(data && data.options && data.options.verboseLog);
  }

  active(conversationId) {
    return !!conversationId && this._on.has(conversationId);
  }

  paths(conversationId) {
    return this._files.paths(conversationId);
  }

  prepare({ conversationId, data, tree = [], path = [], continues = [], stopped = 0, waitedMs = 0, contextWindow = null } = {}) {
    try {
      if (!conversationId) return;
      if (!TurnJournal.enabled(data)) { this._on.delete(conversationId); return; }
      this._attach();
      const st = this._state(conversationId);
      st.window = PromptBudget.window(data, contextWindow);
      if (!st.started && !this._files.exists(conversationId)) this._write(conversationId, { type: 'setup', setup: TurnJournal.setupOf(data), version: this._version });
      st.started = true;
      const digest = TreeDigest.of(tree, data);
      const lastUser = path.map((m) => m && m.role).lastIndexOf('user');
      digest.active = path.slice(0, lastUser + 1).map((m) => m.id);
      const kind = TurnJournal.kindOf(tree, path);
      const change = TreeDigest.diff(st.digest, digest);
      st.digest = digest;
      this._write(conversationId, {
        type: 'turn_prepare', kind: kind.label, player: kind.player, path: digest.active, continues,
        headId: data.headId || null, stopped, waitedMs, state: digest.state,
      });
      if (change) {
        if (kind.newUserId) change.messagesAdded = change.messagesAdded.filter((m) => m.id !== kind.newUserId);
        if (TurnJournal._worthSaying(change)) this._write(conversationId, { type: 'tree_change', change });
      }
    } catch (_) {}
  }

  grounding({ conversationId, body = null, surface = null } = {}) {
    try {
      if (!this._on.has(conversationId)) return;
      this._write(conversationId, { type: 'grounding', body, surface });
    } catch (_) {}
  }

  onRequest(request) {
    try {
      const trace = request && request.trace;
      if (!trace || trace.callType !== 'chat' || !this._on.has(trace.conversationId)) return;
      const st = this._state(trace.conversationId);
      const messages = (Array.isArray(request.messages) ? request.messages : []).map((m) => ({ role: m.role, content: PromptBudget._text(m) }));
      const system = messages.length && messages[0].role === 'system' ? messages[0].content : '';
      const rest = system ? messages.slice(1) : messages.slice();
      const history = rest.slice(0, -1);
      const last = rest.length ? rest[rest.length - 1] : null;
      const shown = [];
      if (system) shown.push(TurnJournal.promptBlock('system', st.lastSystem, system));
      if (history.length) shown.push({ role: 'history', note: history.length + ' messages, one line each', text: history.map((m, i) => TurnJournal._historyLine(m, i)).join('\n') });
      if (last) shown.push({ role: 'newest message (' + last.role + ')', note: 'the player\'s text, then the story state and the scene notes', text: last.content });
      const { trace: _trace, ...extra } = request.extra || {};
      this._write(trace.conversationId, {
        type: 'narrator_request', messageId: trace.turnId || null, modelRef: request.modelRef, temperature: request.temperature,
        window: st.window || null, audit: ContextAudit.of(messages), history: TurnJournal.historyDiff(st.lastHistory, history),
        extra, messages, shown,
      });
      st.lastSystem = system;
      st.lastHistory = history;
    } catch (_) {}
  }

  reply({ conversationId, messageId, content, tidied = null, aborted = false, row = null } = {}) {
    try {
      if (!this._on.has(conversationId)) return;
      const r = row || {};
      const text = String(content || '');
      this._state(conversationId).replyAt = this._now();
      this._write(conversationId, {
        type: 'reply', messageId, aborted: !!aborted, content: text, tidied: tidied && tidied !== text ? tidied : null,
        reasoning: r.reasoning || null, toolCalls: r.toolCalls || null, tokensIn: r.tokensIn == null ? null : r.tokensIn,
        tokensOut: r.tokensOut == null ? null : r.tokensOut, error: r.error || null, words: text.split(/\s+/).filter(Boolean).length,
      });
    } catch (_) {}
  }

  side({ conversationId, messageId, opts, result, ms } = {}) {
    try {
      if (!this._on.has(conversationId)) return;
      const messages = ((opts && opts.messages) || []).map((m) => ({ role: m.role, content: PromptBudget._text(m) }));
      const system = messages.length && messages[0].role === 'system' ? messages[0].content : '';
      const hit = TurnJournal.SIDE_KINDS.find((k) => k.test.test(system.slice(0, 600)));
      const kind = hit ? hit.kind : 'side call';
      const st = this._state(conversationId);
      const r = result || {};
      const tally = st.calls[messageId] || (st.calls[messageId] = []);
      tally.push({ kind: kind.split(' ')[0], ok: !r.error && typeof r.text === 'string' && !!r.text });
      const shown = messages.map((m, i) => (i === 0 && system
        ? TurnJournal.promptBlock('system', st.sideSystem[kind] === undefined ? null : st.sideSystem[kind], system)
        : { role: m.role, note: '', text: m.content }));
      if (system) st.sideSystem[kind] = system;
      this._write(conversationId, {
        type: 'side_call', messageId, kind, modelRef: (opts && opts.modelRef) || null, ms: Number(ms) || 0,
        requestTokens: PromptBudget.estimate(messages.map((m) => m.content).join('\n')), schema: !!(opts && opts.responseFormat),
        temperature: opts && opts.temperature, messages, shown, text: typeof r.text === 'string' ? r.text : '', reasoning: r.reasoning || null, error: r.error || null,
      });
    } catch (_) {}
  }

  changes({ conversationId, messageId, data, tree = [], changes = [] } = {}) {
    try {
      if (!this._on.has(conversationId)) return;
      const st = this._state(conversationId);
      const digest = TreeDigest.of(tree, data);
      st.digest = digest;
      this._write(conversationId, { type: 'state_changes', messageId, changes, state: digest.state, headId: (data && data.headId) || null });
    } catch (_) {}
  }

  end({ conversationId, messageId, status, detail = '' } = {}) {
    try {
      if (!this._on.has(conversationId)) return;
      const st = this._state(conversationId);
      const calls = st.calls[messageId] || [];
      delete st.calls[messageId];
      const missing = status === 'finished' && !calls.some((c) => c.kind === 'stage' && c.ok) ? ['stage'] : [];
      this._write(conversationId, { type: 'reaction_end', messageId, status, detail, calls, missing, ms: st.replyAt ? this._now() - st.replyAt : 0 });
    } catch (_) {}
  }

  static setupOf(data) {
    const d = data || {};
    const row = (r, keys) => Object.fromEntries(keys.filter((k) => r && r[k] !== undefined && r[k] !== null && r[k] !== '').map((k) => [k, r[k]]));
    return {
      scenario: d.scenario || '', tone: d.tone || '', lengthMode: d.lengthMode || '', protagonist: d.protagonist || {},
      llmModel: d.llmModel || '', llmCtx: d.llmCtx || '', sideModel: d.sideModel || '', baseModel: d.baseModel || '', editModel: d.editModel || '',
      style: d.style || '', options: Object.assign({}, d.options || {}),
      characters: (Array.isArray(d.characters) ? d.characters : []).filter(Boolean).map((c) => row(c, ['id', 'name', 'description', 'appearance', 'profile'])),
      scenes: (Array.isArray(d.scenes) ? d.scenes : []).filter(Boolean).map((s) => row(s, ['id', 'name', 'description'])),
    };
  }

  static kindOf(tree, path) {
    const list = Array.isArray(tree) ? tree : [];
    const shown = Array.isArray(path) ? path : [];
    const user = shown.filter((m) => m && m.role === 'user').pop();
    if (!user) return { label: 'turn', player: '', newUserId: null };
    const node = list.find((m) => m.id === user.id) || user;
    const replies = list.filter((m) => m.role === 'assistant' && m.parentId === user.id);
    const wordings = list.filter((m) => m.role === 'user' && (m.parentId || null) === (node.parentId || null));
    const player = String(user.content || node.content || '');
    if (replies.length) return { label: 'regeneration (reply ' + (replies.length + 1) + ' to this message)', player, newUserId: null };
    if (wordings.length > 1) return { label: 'edited message (wording ' + wordings.length + ' of this turn)', player, newUserId: user.id };
    return { label: 'new message', player, newUserId: user.id };
  }

  static historyDiff(prev, cur) {
    if (!Array.isArray(prev)) return { first: true };
    const same = (a, b) => !!a && !!b && a.role === b.role && a.content === b.content;
    if (!prev.length) return { kept: 0, added: cur.length, dropped: 0, rewritten: 0, forkAt: null };
    for (let dropped = 0; dropped < prev.length; dropped += 1) {
      if (!cur.length || !same(prev[dropped], cur[0])) continue;
      let n = 0;
      while (dropped + n < prev.length && n < cur.length && same(prev[dropped + n], cur[n])) n += 1;
      return { kept: n, added: cur.length - n, dropped, rewritten: 0, forkAt: dropped + n < prev.length ? n : null };
    }
    let kept = 0;
    let rewritten = 0;
    let forkAt = null;
    for (let i = 0; i < Math.min(prev.length, cur.length); i += 1) {
      if (same(prev[i], cur[i])) kept += 1;
      else { if (forkAt === null) forkAt = i; if (prev[i].role === cur[i].role) rewritten += 1; }
    }
    return { kept, added: Math.max(0, cur.length - prev.length), dropped: 0, rewritten, forkAt };
  }

  static promptBlock(role, previous, current) {
    const size = current.length + ' characters, about ' + PromptBudget.estimate(current) + ' tokens';
    if (previous === null || previous === undefined) return { role, note: 'first time printed, ' + size, text: current };
    if (previous === current) return { role, note: 'identical to the last one printed', text: '(' + size + ', unchanged)' };
    const was = previous.split('\n');
    const now = current.split('\n');
    const wasSet = new Set(was);
    const nowSet = new Set(now);
    const lines = was.filter((l) => !nowSet.has(l)).map((l) => '- ' + l).concat(now.filter((l) => !wasSet.has(l)).map((l) => '+ ' + l));
    return { role, note: 'CHANGED since the last one printed, ' + size + '; lines removed (-) and added (+)', text: lines.join('\n') || '(only the order of lines changed)' };
  }

  static _historyLine(m, i) {
    const text = String(m.content || '').replace(/\s+/g, ' ').trim();
    return (i + 1) + '. ' + m.role + ' (' + PromptBudget.estimate(m.content) + ' tok): ' + (text.length > TurnJournal.HISTORY_LINE ? text.slice(0, TurnJournal.HISTORY_LINE) + '…' : text);
  }

  static _worthSaying(change) {
    return !!(change.messagesAdded.length || change.messagesRemoved.length || change.branch || change.pointsDropped.length
      || change.headWas !== change.headNow || Object.keys(change.state).length);
  }

  _state(conversationId) {
    let st = this._on.get(conversationId);
    if (!st) {
      st = { started: false, digest: null, lastSystem: null, lastHistory: null, window: null, replyAt: 0, sideSystem: {}, calls: {} };
      this._on.set(conversationId, st);
    }
    return st;
  }

  _attach() {
    let router = null;
    try { router = this._router(); } catch (_) { router = null; }
    if (!router || router === this._observed || typeof router.observeDispatch !== 'function') return;
    if (this._detach) { try { this._detach(); } catch (_) {} }
    this._observed = router;
    this._detach = router.observeDispatch((request) => this.onRequest(request));
  }

  _write(conversationId, event) {
    const full = Object.assign({ at: this._now(), conversationId }, event);
    this._files.append(conversationId, full, JournalMarkdown.render(full));
  }
}

module.exports = TurnJournal;
