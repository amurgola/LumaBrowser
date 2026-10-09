import Dom from '../dom/Dom.js';

export default class AssistField {
  static ASSIST_ICON = '<span class="cm-xassist-ico" aria-hidden="true">✨</span>';
  static STOP_ICON = '<svg viewBox="0 0 24 24" width="11" height="11" aria-hidden="true"><rect x="5" y="5" width="14" height="14" rx="2.5" fill="currentColor"/></svg>';
  static STOP_SAFETY_MS = 1500;
  static FAILED = 'Generation failed.';

  static stripThink(text) {
    return String(text || '').replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/<think>[\s\S]*$/i, '');
  }

  constructor(wrap, input, field, ctx) {
    this._wrap = wrap;
    this._input = input;
    this._field = field;
    this._ctx = ctx;
    this._live = null;
  }

  attach() {
    this._wrapInput();
    this._buildStatus();
    this._button.addEventListener('click', () => this._onClick());
    return this;
  }

  _wrapInput() {
    const holder = Dom.el('div', 'cm-xassist-wrap');
    if (this._input.tagName === 'TEXTAREA') holder.classList.add('cm-xassist-wrap--area');
    this._input.parentNode.replaceChild(holder, this._input);
    holder.appendChild(this._input);
    this._button = Dom.el('button', 'cm-xassist', AssistField.ASSIST_ICON);
    this._button.type = 'button';
    this._button.title = this._idleTitle();
    const rail = Dom.el('div', 'cm-xassist-rail');
    rail.appendChild(this._button);
    holder.appendChild(rail);
    this._holder = holder;
  }

  _buildStatus() {
    this._status = Dom.el('div', 'cm-xassist-status');
    this._wrap.appendChild(this._status);
  }

  async _onClick() {
    if (this._live) { this._live.abort(); return; }
    if (this._button.disabled) return;
    const spec = await this._askSpec();
    if (!spec) return;
    if (typeof spec === 'string') { this._applyDirectText(spec); return; }
    if (!Array.isArray(spec.messages) || !spec.messages.length) return;
    this._dispatch(spec);
  }

  async _askSpec() {
    this._button.disabled = true;
    this._button.classList.add('busy');
    this._setStatus('');
    let spec = null;
    try {
      const { api, model, rootModel, siblingModel } = this._ctx;
      spec = await this._field.assist({
        api, model, rootModel, siblingModel, value: model[this._field.key], setStatus: (m) => this._setStatus(m),
      });
    } catch (e) {
      this._setStatus((e && e.message) || 'failed');
    }
    this._button.disabled = false;
    this._button.classList.remove('busy');
    return spec;
  }

  _applyDirectText(text) {
    if (text.trim()) this._setValue(text.trim());
    this._setStatus('');
  }

  _dispatch(spec) {
    const api = this._ctx.api;
    if (api && api.chat && api.chat.completeStream && typeof api.onChatEvent === 'function') this._runStream(spec);
    else if (api && api.chat && api.chat.complete) this._runOnce(spec);
    else this._setStatus('AI drafting is only available in the desktop app.');
  }

  _runStream(spec) {
    const api = this._ctx.api;
    const run = { requestId: AssistField._requestId(), raw: '', thinkChars: 0, settled: false, off: null };
    run.off = api.onChatEvent((evt) => this._onStreamEvent(run, evt));
    this._setStreaming(true);
    this._live = { abort: () => this._abort(run) };
    Promise.resolve(api.chat.completeStream({ requestId: run.requestId, ...AssistField._request(spec) }))
      .then((r) => { if (r && r.success === false) this._settle(run, run.raw, r.error || AssistField.FAILED); })
      .catch((e) => this._settle(run, run.raw, (e && e.message) || AssistField.FAILED));
  }

  _onStreamEvent(run, evt) {
    if (!evt || evt.requestId !== run.requestId) return;
    const text = (evt.payload && evt.payload.text) || '';
    if (evt.type === 'delta') this._onDelta(run, text);
    else if (evt.type === 'reasoning') this._onReasoning(run, text);
    else if (evt.type === 'done') this._settle(run, text || run.raw);
    else if (evt.type === 'error') this._settle(run, run.raw, (evt.payload && evt.payload.message) || AssistField.FAILED);
  }

  _onDelta(run, text) {
    run.raw += text;
    const shown = AssistField.stripThink(run.raw);
    this._setValue(shown);
    if (shown) this._setStatus('');
    else if (run.raw) this._setStatus('Reasoning…');
  }

  _onReasoning(run, text) {
    run.thinkChars += text.length;
    if (!AssistField.stripThink(run.raw)) this._setStatus('Reasoning… (' + run.thinkChars + ' chars)');
  }

  _abort(run) {
    try { this._ctx.api.chat.completeAbort(run.requestId); } catch (_) {}
    setTimeout(() => this._settle(run, run.raw), AssistField.STOP_SAFETY_MS);
  }

  _settle(run, finalText, errMsg) {
    if (run.settled) return;
    run.settled = true;
    this._live = null;
    try { if (run.off) run.off(); } catch (_) {}
    const out = this._clean(finalText);
    if (out) this._setValue(out);
    this._setStreaming(false);
    this._setStatus(errMsg || '');
  }

  async _runOnce(spec) {
    this._button.disabled = true;
    this._setStreaming(true);
    try {
      const r = await this._ctx.api.chat.complete(AssistField._request(spec));
      this._applyOnceResult(r);
    } catch (e) {
      this._setStatus((e && e.message) || AssistField.FAILED);
    }
    this._setStreaming(false);
    this._button.disabled = false;
  }

  _applyOnceResult(r) {
    if (!(r && r.success && r.text)) { this._setStatus((r && r.error) || AssistField.FAILED); return; }
    const out = this._clean(r.text);
    if (out) this._setValue(out);
    this._setStatus('');
  }

  _setStreaming(on) {
    this._holder.classList.toggle('streaming', on);
    this._button.innerHTML = on ? AssistField.STOP_ICON : AssistField.ASSIST_ICON;
    this._button.title = on ? 'Stop generating' : this._idleTitle();
    this._input.readOnly = on;
  }

  _idleTitle() {
    return this._field.assistTitle || 'Create with AI';
  }

  _setStatus(message) {
    this._status.textContent = message == null ? '' : String(message);
  }

  _setValue(value) {
    this._input.value = value;
    this._ctx.model[this._field.key] = value;
  }

  _clean(text) {
    return typeof this._field.assistClean === 'function' ? this._field.assistClean(text) : AssistField.stripThink(text).trim();
  }

  static _request(spec) {
    return {
      messages: spec.messages,
      temperature: spec.temperature,
      modelRef: spec.modelRef,
      timeoutMs: spec.timeoutMs,
      noThink: spec.noThink,
    };
  }

  static _requestId() {
    return 'assist-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  }
}
