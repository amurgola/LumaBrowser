import DownloadGroups from './DownloadGroups.js';
import DownloadRowView from './DownloadRowView.js';

export default class DownloadsView {
  static EMPTY = 'Files you download will be listed here.';
  static NO_MATCH = (query) => `No downloads match "${query}".`;
  static MISSING_BRIDGE = 'This page must run inside a LumaBrowser tab.';
  static FILE_GONE = 'File not found. It may have been moved or deleted.';
  static LINK_COPIED = 'Link copied';
  static NOTICE_MS = 2400;

  constructor(doc, bridge, { now = () => Date.now() } = {}) {
    this._doc = doc;
    this._bridge = bridge;
    this._now = now;
    this._downloads = new Map();
    this._search = doc.getElementById('dlSearch');
    this._clear = doc.getElementById('dlClear');
    this._list = doc.getElementById('dlList');
    this._empty = doc.getElementById('dlEmpty');
    this._notice = doc.getElementById('dlNotice');
    this._noticeTimer = null;
  }

  async start() {
    if (!this._bridge) return void this._showEmpty(DownloadsView.MISSING_BRIDGE);
    this._listen();
    this._bridge.onEvent((event) => this._onEvent(event));
    await this.reload();
  }

  async reload() {
    const list = (await this._bridge.list()) || [];
    this._downloads = new Map(list.map((download) => [String(download.id), download]));
    this.render();
  }

  render() {
    const all = [...this._downloads.values()];
    const groups = DownloadGroups.build(all, { query: this._search.value, now: this._now() });
    this._list.replaceChildren(...groups.map((group) => this._section(group)));
    this._showEmpty(groups.length ? '' : this._emptyText());
    this._clear.hidden = !all.some((download) => download.state !== 'progress');
  }

  _listen() {
    this._search.addEventListener('input', () => this.render());
    this._clear.addEventListener('click', () => this._bridge.clear());
    this._list.addEventListener('click', (event) => this._onClick(event));
  }

  _onEvent(event) {
    if (!event || event.type !== 'download' || !event.download) return void this.reload();
    const id = String(event.download.id);
    const known = this._downloads.get(id);
    const next = { ...(known || {}), ...event.download };
    this._downloads.set(id, next);
    if (!this._refreshRow(id, next)) this.render();
  }

  _refreshRow(id, download) {
    const row = this._list.querySelector(`[data-id="${id}"]`);
    if (row) return DownloadRowView.refresh(row, download);
    return !DownloadGroups.matches(download, this._search.value);
  }

  _onClick(event) {
    const button = event.target.closest('[data-action]');
    const row = button && button.closest('[data-id]');
    if (!row) return;
    const act = this._actions()[button.dataset.action];
    if (act) act(row.dataset.id);
  }

  _actions() {
    return {
      open: (id) => this._reach(this._bridge.open(id)),
      folder: (id) => this._reach(this._bridge.show(id)),
      copy: (id) => this._copyLink(id),
      cancel: (id) => this._bridge.cancel(id),
      remove: (id) => this._remove(id),
    };
  }

  async _reach(request) {
    const result = await request;
    if (result && result.success) return;
    this._say(DownloadsView.FILE_GONE);
    await this.reload();
  }

  async _copyLink(id) {
    const result = await this._bridge.copyLink(id);
    if (result && result.success) this._say(DownloadsView.LINK_COPIED);
  }

  _remove(id) {
    this._downloads.delete(id);
    this.render();
    this._bridge.remove(id);
  }

  _section(group) {
    const section = this._doc.createElement('section');
    section.className = 'dl-day';
    const title = this._doc.createElement('h2');
    title.className = 'dl-day-title';
    title.textContent = group.label;
    const rows = this._doc.createElement('ul');
    rows.className = 'dl-rows';
    rows.append(...group.downloads.map((download) => DownloadRowView.build(this._doc, download)));
    section.append(title, rows);
    return section;
  }

  _emptyText() {
    const query = this._search.value.trim();
    return query ? DownloadsView.NO_MATCH(query) : DownloadsView.EMPTY;
  }

  _showEmpty(text) {
    this._empty.textContent = text;
    this._empty.hidden = !text;
  }

  _say(text) {
    const view = this._doc.defaultView;
    this._notice.textContent = text;
    this._notice.hidden = false;
    view.clearTimeout(this._noticeTimer);
    this._noticeTimer = view.setTimeout(() => { this._notice.hidden = true; }, DownloadsView.NOTICE_MS);
  }
}
