import HtmlEscaper from '../../../../core/llm-server/ui/js/format/HtmlEscaper.js';
import FoldGroups from '../general/FoldGroups.js';

export default class SharingTokensList {
  constructor({ sharingApi, reload }) {
    this._api = sharingApi;
    this._reload = reload;
    this._wrap = document.getElementById('gsShareTokens');
  }

  install() {
    this._wrap.addEventListener('click', (e) => this._onClick(e));
    document.getElementById('gsShareRevokeAll').addEventListener('click', async () => {
      await this._api.revokeAllTokens();
      this._reload();
    });
  }

  static countText(tokens) {
    const list = tokens || [];
    const revoked = list.filter((t) => t.revoked).length;
    const active = list.length - revoked;
    if (!list.length) return 'None yet';
    return revoked ? `${active} paired, ${revoked} revoked` : `${active} paired`;
  }

  render(tokens) {
    if (!this._wrap) return;
    FoldGroups.summarize('share-clients', SharingTokensList.countText(tokens));
    if (!tokens.length) {
      this._wrap.innerHTML = '<div class="gs-list-empty">No clients paired yet.</div>';
      return;
    }
    this._wrap.innerHTML = tokens.map((t) => SharingTokensList.rowHtml(t)).join('');
  }

  static compact(n) {
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'k';
    return String(n);
  }

  static usageLine(u) {
    if (!u || (!u.totalTokens && !u.images && !u.videos)) return '';
    const parts = [];
    if (u.totalTokens) parts.push(`${SharingTokensList.compact(u.totalTokens)} tokens`);
    if (u.images) parts.push(`${u.images} image${u.images === 1 ? '' : 's'}`);
    if (u.videos) parts.push(`${u.videos} video${u.videos === 1 ? '' : 's'}`);
    return parts.join(', ');
  }

  static rowHtml(t) {
    const esc = HtmlEscaper.escape;
    const usage = SharingTokensList.usageLine(t.usage);
    return `
      <div class="gs-item-card gs-item-row${t.revoked ? ' is-revoked' : ''}">
        <span class="gs-item-main">${esc(t.label)}${t.revoked ? ' (revoked)' : ''}</span>
        ${usage ? `<span class="gs-item-meta" title="Total consumed by this client">${esc(usage)}</span>` : ''}
        <span class="gs-item-meta">${t.lastUsedAt ? 'used ' + esc(new Date(t.lastUsedAt).toLocaleDateString()) : 'never used'}</span>
        ${t.revoked ? '' : `<button class="gs-copy-btn" data-share-revoke="${esc(t.id)}">Revoke</button>`}
        <button class="gs-copy-btn" data-share-remove="${esc(t.id)}">Remove</button>
      </div>`;
  }

  async _onClick(e) {
    const rev = e.target.getAttribute && e.target.getAttribute('data-share-revoke');
    const rem = e.target.getAttribute && e.target.getAttribute('data-share-remove');
    if (rev) { await this._api.revokeToken(rev); this._reload(); }
    else if (rem) { await this._api.removeToken(rem); this._reload(); }
  }
}
