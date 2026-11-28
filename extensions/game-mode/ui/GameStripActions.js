import Dialogs from '../../../core/llm-server/ui/js/dialogs/Dialogs.js';
import GameServerApi from './GameServerApi.js';

export default class GameStripActions {
  static REVOKE_DELAY_MS = 2000;

  static RESET_CONFIRM = 'Wipe this game\'s saved data (saves, NPC memories, generated content)? The code stays.';

  constructor(strip, conversationId) {
    this._strip = strip;
    this._conversationId = conversationId;
  }

  async exportZip() {
    const convId = this._conversationId();
    if (!convId) return;
    this._strip.note('Exporting…');
    try {
      const { blob, filename } = await GameServerApi.exportZip(convId);
      GameStripActions._download(blob, filename);
      this._strip.note('Zip downloaded. Unzip it and open index.html.');
    } catch (e) {
      this._strip.note('Export failed: ' + e.message, true);
    }
  }

  async publishShare() {
    const convId = this._conversationId();
    if (!convId) return;
    this._strip.note('Publishing…');
    try {
      const body = await GameServerApi.publish(convId);
      await this._reportShare(body.share);
    } catch (e) {
      this._strip.note('Share failed: ' + e.message, true);
    }
  }

  async resetStores() {
    const convId = this._conversationId();
    if (!convId) return;
    if (!(await Dialogs.confirm(GameStripActions.RESET_CONFIRM))) return;
    this._strip.note('Resetting…');
    try {
      await GameServerApi.resetStores(convId);
      this._strip.note('Saved data wiped. Press Play (or Reload) to start fresh.');
    } catch (e) {
      this._strip.note('Reset failed: ' + e.message, true);
    }
  }

  async _reportShare(share) {
    if (share && share.available && share.url) {
      try { await navigator.clipboard.writeText(share.url); } catch (_) {}
      this._strip.note('Share link copied: ' + share.url);
      return;
    }
    this._strip.note('Published as an artifact (share links unavailable: '
      + ((share && share.reason) || 'sharing off') + ').');
  }

  static _download(blob, filename) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, GameStripActions.REVOKE_DELAY_MS);
  }
}
