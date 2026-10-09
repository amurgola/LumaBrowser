import Dialogs from '../../dialogs/Dialogs.js';

export default class ChatDataWipe {
  static QUESTION = 'Delete ALL conversations and artifacts, including Dashboard widgets and scheduled tasks? This cannot be undone.';

  static RELOAD_DELAY_MS = 900;

  constructor({ api, doc = document, reload = () => window.location.reload() }) {
    this._api = api;
    this._doc = doc;
    this._reload = reload;
  }

  wire() {
    const btn = this._doc.getElementById('chatDataWipe');
    if (!btn || btn.dataset.wired) return false;
    btn.dataset.wired = '1';
    btn.addEventListener('click', () => this.run(btn));
    return true;
  }

  async run(btn) {
    if (!(await Dialogs.confirm(ChatDataWipe.QUESTION))) return;
    btn.disabled = true;
    this._say('Clearing...');
    try {
      const r = await this._wipe();
      if (!r || !r.success) throw new Error((r && r.error) || 'wipe failed');
      this._say(ChatDataWipe.doneText(r.deleted || {}));
      setTimeout(() => { try { this._reload(); } catch (_) {} }, ChatDataWipe.RELOAD_DELAY_MS);
    } catch (err) {
      this._say('Failed: ' + (err && err.message ? err.message : String(err)));
      btn.disabled = false;
    }
  }

  static doneText(deleted) {
    const convs = deleted.llm_conversations || 0;
    const arts = deleted.llm_artifacts || 0;
    return 'Deleted ' + convs + ' conversation' + (convs === 1 ? '' : 's') + ' and '
      + arts + ' artifact version' + (arts === 1 ? '' : 's') + '. Reloading...';
  }

  _wipe() {
    const conv = this._api && this._api.conv;
    return conv && typeof conv.wipeAll === 'function' ? conv.wipeAll() : Promise.resolve({ success: false, error: 'not available' });
  }

  _say(text) {
    const status = this._doc.getElementById('chatDataStatus');
    if (status) status.textContent = text || '';
  }
}
