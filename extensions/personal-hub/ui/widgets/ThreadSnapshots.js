import WidgetDom from './WidgetDom.js';

export default class ThreadSnapshots {
  static SOURCES = { conversation: 'Read from the conversation', mail: 'Read from the mail' };
  static FALLBACK_SOURCE = 'Read from what its tab is showing';

  constructor({ host, repaint, alive = () => true }) {
    this._host = host;
    this._repaint = repaint;
    this._alive = alive;
    this._shown = new Map();
  }

  has(threadId) {
    return this._shown.has(threadId);
  }

  toggle(threadId) {
    if (!this.has(threadId)) return this.read(threadId);
    this._shown.delete(threadId);
    this._repaint();
    return Promise.resolve();
  }

  async read(threadId) {
    this._shown.set(threadId, { loading: true });
    this._repaint();
    let shown;
    try {
      const { snapshot, reason } = (await this._host.call('snapshotThread', threadId, {})) || {};
      shown = snapshot && snapshot.text ? { text: snapshot.text, scope: snapshot.scope, takenAt: snapshot.takenAt } : { note: reason || 'There was nothing more to read.' };
    } catch (err) {
      shown = { note: (err && err.message) || String(err) };
    }
    if (!this._alive() || !this._shown.has(threadId)) return;
    this._shown.set(threadId, shown);
    this._repaint();
  }

  element(threadId) {
    const shown = this._shown.get(threadId);
    if (!shown) return null;
    if (shown.loading) return WidgetDom.el('div', { class: 'hub-snapshot is-note', text: 'Reading the conversation...' });
    if (shown.note) return WidgetDom.el('div', { class: 'hub-snapshot is-note', text: shown.note });
    const from = ThreadSnapshots.SOURCES[shown.scope] || ThreadSnapshots.FALLBACK_SOURCE;
    return WidgetDom.el('div', { class: 'hub-snapshot' }, [
      WidgetDom.el('div', { class: 'hub-snapshot-from', text: `${from}, ${WidgetDom.relativeTime(shown.takenAt)}` }),
      WidgetDom.el('div', { class: 'hub-snapshot-text', text: shown.text }),
    ]);
  }
}
