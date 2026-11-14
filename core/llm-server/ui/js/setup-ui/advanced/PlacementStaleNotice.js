import Dom from '../../dom/Dom.js';
import HtmlEscaper from '../../format/HtmlEscaper.js';
import PlacementItems from './PlacementItems.js';

export default class PlacementStaleNotice {
  static EXPLAIN = 'A model keeps its place until it next loads.';
  static BUTTON = 'Unload to apply';
  static SAVED_HINT = ' Running models keep their place until they reload (see the notice above the lanes).';

  constructor(view) {
    this._view = view;
  }

  entries() {
    return this._view.model.snapshot.stale || [];
  }

  build() {
    const entries = this.entries();
    if (!entries.length) return null;
    const lines = entries.map((entry) => '<li>' + HtmlEscaper.escape(PlacementStaleNotice.describe(entry)) + '</li>').join('');
    const notice = Dom.el('div', 'adv-stale',
      '<div class="adv-stale-text"><b>Saved, not applied yet.</b> ' + HtmlEscaper.escape(PlacementStaleNotice.EXPLAIN)
      + '<ul>' + lines + '</ul></div>');
    const button = Dom.el('button', 'adv-btn', HtmlEscaper.escape(PlacementStaleNotice.BUTTON));
    button.id = 'advReloadStale';
    button.title = 'Unloads only these models. Each loads again, in its saved place, the next time it is used.';
    button.addEventListener('click', () => this.reload(button));
    notice.appendChild(button);
    return notice;
  }

  async reload(button) {
    const api = this._view.placementApi();
    if (!api || typeof api.reloadStale !== 'function') return;
    button.disabled = true;
    try {
      const reply = await api.reloadStale();
      await this._view.refreshSnapshot();
      this._view.status(PlacementStaleNotice.resultText(reply));
    } catch (e) {
      button.disabled = false;
      this._view.status('Failed: ' + (e && e.message));
    }
  }

  static describe(entry) {
    const label = (PlacementItems.meta(entry.item) || { label: entry.item }).label;
    const target = entry.wantsRam ? 'in System RAM' : 'on ' + PlacementStaleNotice.cards(entry.wants);
    return label + ' is running on ' + PlacementStaleNotice.cards(entry.runningOn) + '. The saved layout puts it ' + target + '.';
  }

  static cards(indexes) {
    return (indexes || []).map((index) => 'GPU ' + index).join(' + ');
  }

  static resultText(reply) {
    if (!(reply && reply.success)) return 'Failed: ' + ((reply && reply.error) || 'unknown');
    const labels = (reply.stopped || []).map((item) => (PlacementItems.meta(item) || { label: item }).label);
    if (!labels.length) return 'Nothing was unloaded.';
    return 'Unloaded ' + labels.join(', ') + '. Each loads in its saved place on next use.';
  }
}
