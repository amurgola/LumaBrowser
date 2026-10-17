import HtmlEscaper from '../../../../core/llm-server/ui/js/format/HtmlEscaper.js';
import Dialogs from '../../../../core/llm-server/ui/js/dialogs/Dialogs.js';

export default class SharingPeersList {
  constructor({ sharingApi, renderProviders }) {
    this._api = sharingApi;
    this._renderProviders = renderProviders;
    this._list = document.getElementById('gsPeersList');
  }

  install() {
    this._list.addEventListener('click', (e) => this._onClick(e));
    this._list.addEventListener('change', (e) => this._onChange(e));
    document.addEventListener('sharing:peers-changed', () => this.load());
  }

  async load() {
    try {
      const peers = await this._api.listPeers();
      this._list.innerHTML = peers.length
        ? peers.map((p) => SharingPeersList.rowHtml(p)).join('')
        : '<div class="gs-list-empty">No peers paired yet.</div>';
    } catch (e) { console.error('sharing peers load failed:', e); }
  }

  static capabilities(p) {
    const gpus = p.gpuCount ? `, ${p.gpuCount} GPU${p.gpuCount === 1 ? '' : 's'}${p.gpusBusy ? ' (busy)' : ''}` : '';
    return `${p.llmCount} LLM${p.llmCount === 1 ? '' : 's'}${p.imageGen ? ', image-gen' : ''}${p.imageEdit ? ', image-edit' : ''}${gpus}`;
  }

  static rowHtml(p) {
    const esc = HtmlEscaper.escape;
    return `
          <div class="gs-item-card">
            <div class="gs-item-row">
              <span class="gs-item-main gs-item-title">${esc(p.name)}</span>
              ${p.gpuCount ? `<label class="luma-check gs-item-meta" title="Borrow this peer's GPUs for local model runs (llama.cpp RPC). The next server start splits the model across both machines.">
                <input type="checkbox" data-peer-gpus="${esc(p.id)}" ${p.gpusAttached ? 'checked' : ''}> Attach GPUs</label>` : ''}
              <label class="luma-switch" title="Use this peer's resources">
                <input type="checkbox" data-peer-enabled="${esc(p.id)}" ${p.enabled ? 'checked' : ''}>
                <span class="luma-switch-track"></span>
              </label>
              <button class="gs-copy-btn" data-peer-refresh="${esc(p.id)}">Refresh</button>
              <button class="gs-copy-btn" data-peer-remove="${esc(p.id)}">Remove</button>
            </div>
            <div class="gs-item-details">
              <span>${esc(p.endpoint)}</span>
              <span>${SharingPeersList.capabilities(p)}</span>
              ${SharingPeersList._securityBadge(p)}
              ${p.error ? `<span class="gs-inline-error">${esc(p.error)}</span>` : ''}
            </div>
          </div>`;
  }

  static _securityBadge(p) {
    if (p.secure) {
      return `<span class="luma-badge ok" title="${p.tlsFingerprint ? 'Pinned certificate ' + HtmlEscaper.escape(p.tlsFingerprint) : 'TLS'}">encrypted</span>`;
    }
    return '<span class="luma-badge warn" title="This host does not offer an encrypted listener. Update the host, then hit Refresh to upgrade.">unencrypted</span>';
  }

  async _onClick(e) {
    const el = e.target;
    const refresh = el.getAttribute && el.getAttribute('data-peer-refresh');
    const remove = el.getAttribute && el.getAttribute('data-peer-remove');
    if (refresh) {
      el.textContent = '...';
      await this._api.refreshPeer(refresh);
      this.load();
      this._renderProviders();
    } else if (remove && await Dialogs.confirm('Remove this peer and its shared resources?', { okLabel: 'Remove', danger: true })) {
      await this._api.removePeer(remove);
      this.load();
      this._renderProviders();
    }
  }

  async _onChange(e) {
    const gpuId = e.target.getAttribute && e.target.getAttribute('data-peer-gpus');
    if (gpuId) {
      await this._api.setPeerGpusAttached(gpuId, e.target.checked);
      return;
    }
    const id = e.target.getAttribute && e.target.getAttribute('data-peer-enabled');
    if (!id) return;
    await this._api.setPeerEnabled(id, e.target.checked);
    this._renderProviders();
  }
}
