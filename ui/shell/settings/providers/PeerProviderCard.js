import HtmlEscaper from '../../../../core/llm-server/ui/js/format/HtmlEscaper.js';
import Dialogs from '../../../../core/llm-server/ui/js/dialogs/Dialogs.js';

export default class PeerProviderCard {
  static build(config, peer, ctx) {
    const card = document.createElement('div');
    card.className = 'provider-card';
    card.innerHTML = PeerProviderCard.html(config, peer);
    card.querySelector('[data-field="selectedModel"]').addEventListener('change', (e) => PeerProviderCard._pickModel(config, e.target.value, ctx));
    card.querySelector('.provider-peer-refresh-btn').addEventListener('click', (e) => PeerProviderCard._refresh(config, e.target, ctx));
    card.querySelector('.provider-peer-remove-btn').addEventListener('click', () => PeerProviderCard._remove(config, ctx));
    return card;
  }

  static summary(config, peer) {
    const n = (config.models || []).length;
    const bits = [`${n} shared LLM${n === 1 ? '' : 's'}`];
    if (peer && peer.imageGen) bits.push('image generation');
    if (peer && peer.imageEdit) bits.push('image editor');
    return bits.join(', ');
  }

  static html(config, peer) {
    const esc = HtmlEscaper.escape;
    const online = !peer || peer.online !== false;
    const secure = !!(peer && peer.secure);
    return `
        <div class="provider-card-header">
          <span class="provider-card-name">${esc(config.name || 'Shared peer')}</span>
          <span class="provider-card-status ${online ? 'configured' : ''}">${online ? 'Connected' : 'Offline'}</span>
        </div>
        <div class="provider-card-body">
          <div class="form-help">
            Another LumaBrowser shared over your network. ${esc(PeerProviderCard.summary(config, peer))}.
            <span style="color:${secure ? '#4ade80' : '#fbbf24'};" title="${secure ? 'Traffic is encrypted with a certificate pinned at pair time' : 'This host does not offer an encrypted listener'}">${secure ? 'Encrypted' : 'Unencrypted'}</span>
            ${peer && peer.error ? `<span style="color:#f87171;"> ${esc(peer.error)}</span>` : ''}
          </div>
          <div class="form-group">
            <label class="form-label">Endpoint</label>
            <span class="gs-url-display provider-managed-value">${esc(config.endpoint || '')}</span>
          </div>
          <div class="form-group">
            <label class="form-label">Model</label>
            <select class="form-select" data-field="selectedModel">
              ${(config.models || []).map((m) => `<option value="${esc(m.id)}" ${m.id === config.selectedModel ? 'selected' : ''}>${esc(m.luma_label || m.id)}</option>`).join('')}
            </select>
          </div>
          <div class="form-buttons" style="display:flex; gap:8px; margin-top:8px;">
            <button class="btn btn-secondary provider-peer-refresh-btn">Refresh</button>
            <button class="btn btn-secondary provider-peer-remove-btn" style="color:#e74c3c;">Remove</button>
          </div>
          <div class="form-help" style="margin-top:6px;">
            Enable/disable or inspect this connection in Settings, Network Sharing.
          </div>
        </div>
      `;
  }

  static async _pickModel(config, model, ctx) {
    config.selectedModel = model;
    await ctx.list.save();
    ctx.log.add(`Model for "${config.name}" set to ${model}`, 'success');
    ctx.pingChat();
  }

  static async _refresh(config, btn, ctx) {
    btn.disabled = true;
    btn.textContent = 'Refreshing...';
    try { await window.sharingAPI.refreshPeer(config.peerId); } catch (_) {}
    document.dispatchEvent(new CustomEvent('sharing:peers-changed'));
    await ctx.list.render();
  }

  static async _remove(config, ctx) {
    const ok = await Dialogs.confirm(`Disconnect from "${config.name}" and remove its shared resources?`, { okLabel: 'Disconnect', danger: true });
    if (!ok) return;
    try { await window.sharingAPI.removePeer(config.peerId); } catch (_) {}
    document.dispatchEvent(new CustomEvent('sharing:peers-changed'));
    ctx.pingChat();
    await ctx.list.render();
  }
}
