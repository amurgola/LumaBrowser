import ChatIcons from '../ChatIcons.js';
import ReplyChoices from '../turns/ReplyChoices.js';
import HtmlEscaper from '../../format/HtmlEscaper.js';

export default class VoiceBridge {
  constructor(ctx) {
    this._ctx = ctx;
    this._ctl = null;
  }

  ensure() {
    if (this._ctl) return this._ctl;
    const factory = this._ctx.collaborators.voiceFactory;
    const api = this._ctx.api;
    if (!factory || !api.voice) return null;
    this._ctl = factory.create({
      api,
      chat: {
        submit: (text) => this._ctx.sender.submit(text),
        abort: () => this._ctx.sender.abort(),
        isStreaming: () => !!this._ctx.state.streaming,
      },
      onReadingChange: (key, readingState) => this.paintReadButtons(key, readingState),
    });
    return this._ctl;
  }

  active() {
    return !!(this._ctl && this._ctl.active);
  }

  onDelta(text) {
    if (this.active()) { try { this._ctl.onChatDelta(text); } catch (_) {} }
  }

  onTurnDone(aborted) {
    if (!this.active()) return;
    try { if (aborted) this._ctl.onTurnError(); else this._ctl.onTurnDone(); } catch (_) {}
  }

  onTurnError() {
    if (this.active()) { try { this._ctl.onTurnError(); } catch (_) {} }
  }

  canReadAloud() {
    const api = this._ctx.api;
    return !!(this._ctx.collaborators.voiceFactory && api.voice && api.voice.tts);
  }

  readAloud(m, btn) {
    const ctl = this.ensure();
    if (!ctl || typeof ctl.readAloud !== 'function') return;
    ctl.readAloud(ReplyChoices.parse(m.content).text, m.id, btn);
  }

  stopReading() {
    if (this._ctl && typeof this._ctl.stopReading === 'function') this._ctl.stopReading();
  }

  readButtonHtml(m) {
    if (!this.canReadAloud()) return '';
    const on = !!m.id && this._readingKey() === m.id;
    return '<button class="cm-act' + (on ? ' reading' : '') + '" data-tact="speak"'
      + (on ? ' data-reading="' + HtmlEscaper.escape(this._ctl.readingState || 'starting') + '"' : '')
      + ' title="' + (on ? 'Stop reading' : 'Read aloud') + '">'
      + (on ? ChatIcons.readStop : ChatIcons.readAloud) + '</button>';
  }

  paintReadButtons(key, readingState) {
    document.querySelectorAll('.cm-turn[data-msg-id] [data-tact="speak"]').forEach((b) => {
      const turn = b.closest('.cm-turn[data-msg-id]');
      const on = !!key && turn && turn.dataset.msgId === key;
      b.classList.toggle('reading', on);
      if (on) b.dataset.reading = readingState || 'starting';
      else delete b.dataset.reading;
      b.title = on ? 'Stop reading' : 'Read aloud';
      b.innerHTML = on ? ChatIcons.readStop : ChatIcons.readAloud;
    });
  }

  _readingKey() {
    return this._ctl && this._ctl.readingKey ? this._ctl.readingKey : null;
  }
}
