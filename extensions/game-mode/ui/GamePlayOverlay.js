export default class GamePlayOverlay {
  static SANDBOX = 'allow-scripts allow-same-origin allow-pointer-lock allow-forms allow-modals';

  static FOCUS_DELAY_MS = 50;

  static BAR_HTML = `
      <div class="gm-play-bar">
        <button type="button" class="gm-btn" data-gm="back">Back to chat</button>
        <span class="gm-play-title"></span>
        <span class="gm-ai-pill" hidden></span>
        <span class="gm-play-spacer"></span>
        <button type="button" class="gm-btn" data-gm="reload">Reload</button>
        <button type="button" class="gm-btn" data-gm="popout">Pop out</button>
      </div>
      <div class="gm-play-body"></div>`;

  constructor({ playUrl, onPopOut }) {
    this._playUrl = playUrl;
    this._onPopOut = onPopOut;
    this._el = null;
    this._frame = null;
  }

  get element() {
    return this._el;
  }

  listen(win) {
    win.addEventListener('message', (e) => this._onMessage(e));
  }

  show(title, ai) {
    this._ensure();
    this._el.querySelector('.gm-play-title').textContent = title || 'Game';
    this.setAiPill(ai ? { online: true, pending: 0 } : null);
    this._el.hidden = false;
    this._frame.src = this._playUrl(true);
    setTimeout(() => { try { this._frame.focus(); } catch (_) {} }, GamePlayOverlay.FOCUS_DELAY_MS);
  }

  hide() {
    if (!this._el) return;
    this._el.hidden = true;
    if (this._frame) this._frame.src = 'about:blank';
  }

  setAiPill(st) {
    const pill = this._el && this._el.querySelector('.gm-ai-pill');
    if (!pill) return;
    if (!st) {
      pill.hidden = true;
      return;
    }
    pill.hidden = false;
    const pending = Number(st.pending) || 0;
    pill.classList.toggle('gm-ai-busy', pending > 0);
    pill.classList.toggle('gm-ai-off', st.online === false);
    pill.textContent = GamePlayOverlay._pillText(st.online, pending);
  }

  static _pillText(online, pending) {
    if (online === false) return 'AI offline';
    return pending > 0 ? `AI thinking${pending > 1 ? ` (${pending})` : ''}` : 'AI ready';
  }

  _ensure() {
    if (this._el && this._el.isConnected) return;
    this._el = this._createOverlay();
    this._frame = this._createFrame();
    this._el.querySelector('.gm-play-body').appendChild(this._frame);
    this._el.addEventListener('click', (e) => this._onClick(e));
    document.body.appendChild(this._el);
  }

  _createOverlay() {
    const el = document.createElement('div');
    el.className = 'gm-play';
    el.setAttribute('data-cm-overlay', '');
    el.hidden = true;
    el.innerHTML = GamePlayOverlay.BAR_HTML;
    return el;
  }

  _createFrame() {
    const frame = document.createElement('iframe');
    frame.className = 'gm-frame';
    frame.setAttribute('referrerpolicy', 'no-referrer');
    frame.setAttribute('sandbox', GamePlayOverlay.SANDBOX);
    return frame;
  }

  _onClick(e) {
    const btn = e.target && e.target.closest ? e.target.closest('[data-gm]') : null;
    if (!btn) return;
    const act = btn.getAttribute('data-gm');
    if (act === 'back') this.hide();
    else if (act === 'reload') this._reload();
    else if (act === 'popout') this._onPopOut();
  }

  _reload() {
    this._frame.src = this._playUrl(true);
    this._frame.focus();
  }

  _onMessage(e) {
    const d = e && e.data;
    if (!d || d.type !== 'luma-ai-status') return;
    if (!this._frame || e.source !== this._frame.contentWindow) return;
    this.setAiPill(d);
  }
}
