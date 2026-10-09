import Dialogs from '../../../core/llm-server/ui/js/dialogs/Dialogs.js';
import GameServerApi from './GameServerApi.js';

export default class GamePanelActions {
  static REVOKE_DELAY_MS = 2000;

  static RESET_CONFIRM = 'Wipe this game\'s saved data (saves, NPC memories, generated content)? The code stays.';

  constructor(panel, conversationId) {
    this._panel = panel;
    this._conversationId = conversationId;
  }

  async exportZip() {
    const convId = this._conversationId();
    if (!convId) return;
    this._panel.note('Exporting…');
    try {
      const { blob, filename } = await GameServerApi.exportZip(convId);
      GamePanelActions._download(blob, filename);
      this._panel.note('Zip downloaded. Unzip it and open index.html.');
    } catch (e) {
      this._panel.note('Export failed: ' + e.message, true);
    }
  }

  async publishShare() {
    const convId = this._conversationId();
    if (!convId) return;
    this._panel.note('Publishing…');
    try {
      const body = await GameServerApi.publish(convId);
      await this._reportShare(body.share);
    } catch (e) {
      this._panel.note('Share failed: ' + e.message, true);
    }
  }

  async resetStores() {
    const convId = this._conversationId();
    if (!convId) return;
    if (!(await Dialogs.confirm(GamePanelActions.RESET_CONFIRM))) return;
    this._panel.note('Resetting…');
    try {
      await GameServerApi.resetStores(convId);
      this._panel.note('Saved data wiped. Press Play (or Reload) to start fresh.');
    } catch (e) {
      this._panel.note('Reset failed: ' + e.message, true);
    }
  }

  async _reportShare(share) {
    if (share && share.available && share.url) {
      try { await navigator.clipboard.writeText(share.url); } catch (_) {}
      this._panel.note('Share link copied: ' + share.url);
      return;
    }
    this._panel.note('Published as an artifact (share links unavailable: '
      + ((share && share.reason) || 'sharing off') + ').');
  }

  static _download(blob, filename) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, GamePanelActions.REVOKE_DELAY_MS);
  }
}
