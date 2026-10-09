import HtmlEscaper from '../../../core/llm-server/ui/js/format/HtmlEscaper.js';

export default class Composer {
  static MAX_HEIGHT_PX = 160;
  static MAX_HISTORY = 100;
  static FLASH_MS = 2500;

  constructor(el, page) {
    this._el = el;
    this._page = page;
    this._history = [];
    this._historyIdx = -1;
    this._placeholder = '';
    this.suggestion = '';
    el.input.addEventListener('input', () => { this.grow(); this.paintGhost(); this.paintHint(); });
    el.input.addEventListener('keydown', (e) => this._onKeydown(e));
    el.sendBtn.addEventListener('click', () => page.submit());
    el.stopBtn.addEventListener('click', () => page.abort());
  }

  get value() {
    return this._el.input.value;
  }

  set value(text) {
    this._el.input.value = text;
  }

  commit(text) {
    this._history.push(text);
    if (this._history.length > Composer.MAX_HISTORY) this._history.shift();
    this._historyIdx = -1;
    this._el.input.value = '';
    this.grow();
  }

  focus() {
    this._el.input.focus();
  }

  insertText(text) {
    this._el.input.value = (this._el.input.value ? this._el.input.value + ' ' : '') + text;
    this.grow();
    this._el.input.focus();
  }

  grow() {
    const input = this._el.input;
    input.style.height = 'auto';
    input.style.height = Math.min(Composer.MAX_HEIGHT_PX, input.scrollHeight) + 'px';
  }

  setSuggestion(text) {
    this.suggestion = text || '';
    this._el.ghost.textContent = this.suggestion;
    this.paintGhost();
    this.paintHint();
  }

  setPlaceholder(text) {
    this._placeholder = text;
    this._el.input.placeholder = text;
  }

  paintGhost() {
    const input = this._el.input;
    const show = !!this.suggestion && !input.value;
    this._el.ghost.classList.toggle('show', show);
    if (show) {
      if (input.placeholder) this._placeholder = input.placeholder;
      input.placeholder = '';
    } else if (!input.placeholder && this._placeholder) {
      input.placeholder = this._placeholder;
    }
  }

  paintHint() {
    const right = this._page.state.approval === 'never' ? 'approvals off' : '';
    this._el.hint.innerHTML = '<span>' + this._hintLeft() + '</span>' + (right ? '<span class="r">' + right + '</span>' : '');
  }

  flashHint(text) {
    this._el.hint.innerHTML = '<span>' + HtmlEscaper.escapeKeepingApostrophes(text) + '</span>';
    setTimeout(() => this.paintHint(), Composer.FLASH_MS);
  }

  _hintLeft() {
    const state = this._page.state;
    if (state.streaming) {
      if (state.turn.stopping) return 'stopping…';
      return '<b>esc</b> stop' + (state.turn.followupsQueued ? ' · ' + state.turn.followupsQueued + ' queued' : '');
    }
    if (this.suggestion && !this._el.input.value) return '<b>tab</b> takes the suggestion';
    return '<b>enter</b> send · <b>shift+enter</b> line';
  }

  _onKeydown(e) {
    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.altKey) { e.preventDefault(); this._page.submit(); return; }
    if (e.key === 'Tab' && this.suggestion && !this._el.input.value) { e.preventDefault(); this._takeSuggestion(); return; }
    if (e.key === 'Escape') { this._onEscape(e); return; }
    if (e.key === 'ArrowUp' && !this._el.input.value && this._history.length) { e.preventDefault(); this._historyBack(); return; }
    if (e.key === 'ArrowDown' && this._historyIdx >= 0) { e.preventDefault(); this._historyForward(); }
  }

  _takeSuggestion() {
    this._el.input.value = this.suggestion;
    this.setSuggestion('');
    this.grow();
  }

  _onEscape(e) {
    if (this._page.state.streaming) {
      e.preventDefault();
      this._page.abort();
    } else if (this._el.input.value) {
      this._el.input.value = '';
      this.grow();
    }
  }

  _historyBack() {
    this._historyIdx = this._historyIdx < 0 ? this._history.length - 1 : Math.max(0, this._historyIdx - 1);
    this._el.input.value = this._history[this._historyIdx];
    this.grow();
  }

  _historyForward() {
    this._historyIdx += 1;
    if (this._historyIdx >= this._history.length) {
      this._historyIdx = -1;
      this._el.input.value = '';
    } else {
      this._el.input.value = this._history[this._historyIdx];
    }
    this.grow();
  }
}
