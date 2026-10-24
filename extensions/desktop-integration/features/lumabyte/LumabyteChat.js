const LumabyteActions = require('./LumabyteActions');

class LumabyteChat {
  static TIMEOUT_MS = 240000;
  static HISTORY_MESSAGES = 20;
  static MAX_STEPS = 6;

  constructor({ getRouter, context, threads, actions = null, options = () => ({}) }) {
    this._getRouter = getRouter;
    this._context = context;
    this._threads = threads;
    this._actions = actions;
    this._options = options;
  }

  capabilities() {
    const router = this._getRouter();
    if (!router || typeof router.completeStream !== 'function') return { ready: false, vision: false, canAct: false, model: '', reason: 'The AI chat is not running' };
    const opts = this._options();
    let ref = String(opts.modelRef || '').trim() || undefined;
    try { if (typeof router.resolveModelRef === 'function') ref = router.resolveModelRef(ref); } catch (_) {}
    if (!ref) return { ready: false, vision: false, canAct: false, model: '', reason: 'No chat model is set up (Settings > Models)' };
    const support = LumabyteChat.visionSupport(router, ref);
    const actReason = this._actReason(opts);
    const canRead = opts.files !== false && !!this._actions && typeof this._actions.canRead === 'function' && this._actions.canRead();
    return { ready: true, vision: support !== 'none', visionLoads: support === 'available' || support === 'unknown', canAct: !actReason, actReason, canRead, model: ref, reason: null };
  }

  static types(caps) {
    return [...(caps.canAct ? LumabyteActions.DESKTOP_TYPES : []), ...(caps.canRead ? ['read'] : [])];
  }

  send(att, text, emit) {
    const turn = { aborted: false, handle: null };
    const prompt = String(text || '').trim();
    this._run(att, prompt, emit, turn).catch((err) => emit({ type: 'error', error: (err && err.message) || String(err) }));
    return {
      abort: () => {
        turn.aborted = true;
        if (turn.handle) { try { turn.handle.abort(); } catch (_) {} }
      },
    };
  }

  async _run(att, prompt, emit, turn) {
    if (!prompt) throw new Error('Type a message first');
    const caps = this.capabilities();
    if (!caps.ready) throw new Error(caps.reason);
    const opts = this._options();
    const history = this._threads.messages(att.key).slice(-LumabyteChat.HISTORY_MESSAGES).map((m) => ({ role: m.role, content: m.content }));
    this._threads.append(att.key, { role: 'user', content: prompt }, att.label);
    const turnMessages = [];
    const done = [];
    const types = LumabyteChat.types(caps);
    let stepCount = 0;
    for (let step = 0; step < LumabyteChat.MAX_STEPS; step += 1) {
      emit({ type: 'status', text: step ? 'Looking again' : 'Looking at the window' });
      const ctx = await this._look(att.hwnd, caps, opts);
      if (turn.aborted) return emit({ type: 'done', text: '', aborted: true });
      const last = done.slice(-stepCount);
      turnMessages.push({ role: 'user', content: step ? LumabyteChat.followUp(prompt, LumabyteActions.report(last), ctx, LumabyteActions.outputs(last)) : LumabyteChat.userMessage(prompt, ctx) });
      const messages = [{ role: 'system', content: LumabyteChat.systemPrompt(ctx, { vision: !!ctx.png, canAct: caps.canAct, actReason: caps.actReason, canRead: caps.canRead }) }, ...history, ...turnMessages];
      emit({ type: 'status', text: 'Thinking', seen: { screenshot: !!ctx.png, text: !!ctx.text, notes: ctx.notes } });
      const reply = LumabyteChat.clean(await this._stream(types, caps, opts, messages, ctx, emit, turn));
      if (turn.aborted) return this._finish(att, emit, '', done, true);
      const plan = types.length ? LumabyteActions.parse(reply, { types }) : null;
      if (!plan) return this._finish(att, emit, LumabyteChat.plainText(reply, caps), done, false);
      if (plan.say) emit({ type: 'status', text: plan.say });
      const onStep = (s) => emit({ type: 'step', index: done.length + s.index, text: s.text, state: s.state, error: s.error });
      const results = await this._actions.run(att.hwnd, plan.actions, onStep, { folder: ctx.folder ? ctx.folder.folder : null });
      done.push(...results);
      stepCount = results.length;
      turnMessages.push({ role: 'assistant', content: reply });
      if (turn.aborted) return this._finish(att, emit, '', done, true);
    }
    return this._finish(att, emit, 'I stopped after several steps. Tell me if you want me to keep going.', done, false);
  }

  async _look(hwnd, caps, opts) {
    const wantText = opts.windowText !== false;
    const refText = caps.canAct && wantText ? await this._actions.observe(hwnd).catch(() => null) : null;
    const ctx = await this._context.read(hwnd, { screenshot: caps.vision && opts.screenshot !== false, text: wantText && !refText });
    if (refText) ctx.text = refText;
    ctx.folder = caps.canRead ? await this._actions.folderOf(hwnd, { exe: ctx.app && ctx.app.exe, title: ctx.title }) : null;
    return ctx;
  }

  _stream(types, caps, opts, messages, ctx, emit, turn) {
    return new Promise((resolve, reject) => {
      let text = '';
      let mode = types.length ? 'undecided' : 'stream';
      const decide = () => {
        const t = text.replace(/^\s*(<think>[\s\S]*?<\/think>)?\s*/i, '');
        if (!t) return;
        mode = /^(`|\{)/.test(t) ? 'hold' : 'stream';
        if (mode === 'stream') emit({ type: 'delta', text: t });
      };
      turn.handle = this._getRouter().completeStream({
        messages,
        modelRef: caps.model,
        temperature: 0.4,
        timeoutMs: LumabyteChat.TIMEOUT_MS,
        noThink: !opts.thinking,
        images: ctx.png ? [{ kind: 'image', name: 'window.png', mime: 'image/png', base64: ctx.png }] : [],
      }, {
        onDelta: (t) => {
          text += t;
          if (mode === 'stream') emit({ type: 'delta', text: t });
          else if (mode === 'undecided') decide();
        },
        onReasoning: () => emit({ type: 'reasoning' }),
        onDone: (full) => resolve(typeof full === 'string' && full ? full : text),
        onError: (err) => reject(err instanceof Error ? err : new Error(String(err))),
      });
      if (turn.aborted && turn.handle) turn.handle.abort();
    });
  }

  _finish(att, emit, reply, done, aborted) {
    const summary = done.length ? `(${done.map((r) => `${r.ok ? '' : 'Failed: '}${r.text}`).join('; ')})` : '';
    const saved = [summary, reply].filter(Boolean).join('\n\n');
    if (saved) this._threads.append(att.key, { role: 'assistant', content: saved }, att.label);
    emit({ type: 'done', text: reply, aborted, acted: done.length });
  }

  _actReason(opts) {
    if (opts.actions === false) return 'Acting is off in the Lumabyte settings';
    if (!this._actions) return 'Desktop control is not available';
    return this._actions.unavailableReason();
  }

  static visionSupport(router, ref) {
    try {
      if (typeof router.modelVisionSupport === 'function') return router.modelVisionSupport(ref) || 'none';
      return typeof router.modelVisionActive === 'function' && router.modelVisionActive(ref) ? 'active' : 'none';
    } catch (_) {
      return 'none';
    }
  }

  static systemPrompt(ctx, { vision, canAct = false, actReason = null, canRead = false }) {
    const sees = [vision ? 'a screenshot of the window' : null, ctx.text ? 'its accessible text (control roles and names, numbered [n] when they can be clicked)' : null].filter(Boolean);
    const lines = [
      `You are Lumabyte, LumaBrowser's desktop companion, attached to the ${ctx.app.name} window "${ctx.title}".`,
      sees.length
        ? `Every user message comes with a fresh look at that window: ${sees.join(' and ')}, taken when the message was sent.`
        : 'You cannot see the window this turn; say so if the question needs it.',
      'Ground answers in what is on screen right now. Refer to things by the labels shown so the user can find them, and say plainly when something is not visible.',
      'Be concise: short paragraphs or steps, no preamble.',
    ];
    if (canAct || canRead) {
      const can = [canAct ? 'act on this window when the user asks you to do something in it (open, click, type, scroll)' : null, canRead ? 'read files and folders on this computer' : null].filter(Boolean);
      const example = canAct ? '{"actions":[{"type":"click","ref":12,"double":true}],"say":"Opening the out folder"}' : '{"actions":[{"type":"read","path":"notes.md"}],"say":"Reading notes.md"}';
      const kinds = [];
      if (canAct) kinds.push('click {ref or description, double?, button?: "right"}', 'type {text, ref?, submit?}', 'key {keys, e.g. "enter", "ctrl+l", "alt+left"}', 'scroll {direction, amount?}');
      if (canRead) kinds.push('read {path}: the text of a file (text, code, Markdown, PDF) or the list of a folder; path is absolute, or a name in the open folder');
      lines.push(
        `You can ${can.join(', and ')}. To do so, reply with ONLY this block and nothing else:`,
        '```actions\n' + example + '\n```',
        `Action types: ${kinds.join('; ')}.${canAct ? ' Use the [n] refs from the window text; use description ("the Save button") only when there is no ref.' : ''}`,
      );
      if (canRead) lines.push('To learn what is in a file (summarize it, answer about it), read it with a read action rather than opening it in an app.');
      lines.push('After the actions run you get a fresh look at the window and anything you read. Act again if the request needs more steps, otherwise answer in plain text. Answer questions that need no action in plain text.');
    }
    if (!canAct) {
      lines.push(`You cannot click or type in this window right now (${actReason || 'acting is unavailable'}). If asked to, say what the user should click instead, and that they can let you act by fixing that.${canRead ? '' : ' Never write action JSON.'}`);
    }
    return lines.join('\n');
  }

  static userMessage(prompt, ctx) {
    return [...LumabyteChat._contextParts(ctx), prompt].join('\n\n');
  }

  static followUp(prompt, report, ctx, outputs = '') {
    return [`[Actions run]\n${report}`, ...(outputs ? [outputs] : []), ...LumabyteChat._contextParts(ctx), `Continue with the request: "${prompt}". Act again if needed, otherwise answer in plain text.`].join('\n\n');
  }

  static _contextParts(ctx) {
    const parts = [`[Window: ${ctx.app.name} - "${ctx.title}"]`];
    if (ctx.folder && ctx.folder.folder) {
      parts.push(`[Open folder: ${ctx.folder.folder}]`);
      if (ctx.folder.selected && ctx.folder.selected.length) parts.push(`[Selected: ${ctx.folder.selected.slice(0, 20).join('; ')}]`);
    }
    if (ctx.text) parts.push(`[Accessible text]\n${ctx.text}`);
    if (ctx.notes && ctx.notes.length) parts.push(`[Not available this turn: ${ctx.notes.join('; ')}]`);
    return parts;
  }

  static plainText(reply, caps = {}) {
    if (!LumabyteActions.parse(reply)) return reply;
    if (caps.canAct) return 'I wanted to read a file for that, but reading files is off in the Lumabyte settings.';
    return 'I can only describe this window right now, not act in it. Allow desktop control in the LLM tab to let me click and type.';
  }

  static clean(text) {
    return String(text || '').replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  }
}

module.exports = LumabyteChat;
