import HtmlEscaper from '../../../../core/llm-server/ui/js/format/HtmlEscaper.js';

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

  render(tokens) {
    if (!this._wrap) return;
    if (!tokens.length) {
      this._wrap.innerHTML = '<div class="luma-empty luma-empty--plain" style="text-align:left;padding:4px 0;">No clients paired yet.</div>';
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
      <div class="gs-item-card" style="display:flex;gap:8px;align-items:center;padding:6px 10px;${t.revoked ? 'opacity:0.5;' : ''}">
        <span style="flex:1;font-size:12px;color:var(--text-primary);">${esc(t.label)}${t.revoked ? ' (revoked)' : ''}</span>
        ${usage ? `<span style="font-size:10px;color:var(--text-secondary);" title="Total consumed by this client">${esc(usage)}</span>` : ''}
        <span style="font-size:10px;color:var(--text-muted);">${t.lastUsedAt ? 'used ' + esc(new Date(t.lastUsedAt).toLocaleDateString()) : 'never used'}</span>
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
