import Dialogs from '../../../core/llm-server/ui/js/dialogs/Dialogs.js';

export default class BrowsingDataCleaner {
  constructor({ log, historyModal }) {
    this._log = log;
    this._history = historyModal;
  }

  async clearHistory() {
    const ok = await Dialogs.confirm('Clear all browsing history?', { title: 'Clear history', okLabel: 'Clear', danger: true });
    if (!ok) return;
    try {
      await window.historyAPI.clear({});
      this._log.add('Browsing history cleared', 'success');
      if (this._history && this._history.isOpen()) this._history.refresh();
    } catch (e) {
      this._log.add(`Failed to clear history: ${e.message}`, 'error');
    }
  }

  async clearCache() {
    const ok = await Dialogs.confirm('Clear the browser cache? Cached images and files will be removed.', { title: 'Clear cache', okLabel: 'Clear', danger: true });
    if (!ok) return;
    try {
      const res = await window.tabAPI.clearCache();
      if (res && res.success) this._log.add('Browser cache cleared', 'success');
      else this._log.add('Failed to clear cache', 'error');
    } catch (e) {
      this._log.add(`Failed to clear cache: ${e.message}`, 'error');
    }
  }
}
