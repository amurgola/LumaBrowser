import HtmlEscaper from '../../../../core/llm-server/ui/js/format/HtmlEscaper.js';

export default class PeerDiscovery {
  static INTERVAL_MS = 2500;

  static DEFAULT_PORT = '3000';

  constructor({ el, onPick }) {
    this._el = el;
    this._onPick = onPick;
    this._timer = null;
  }

  install() {
    if (!this._el) return;
    this._el.onclick = (e) => {
      const addr = e.target.getAttribute && e.target.getAttribute('data-new-peer-pick');
      if (addr == null) return;
      this._onPick(PeerDiscovery.address(addr, e.target.getAttribute('data-new-peer-pick-port')));
    };
  }

  static address(addr, port) {
    return port && port !== PeerDiscovery.DEFAULT_PORT ? `${addr}:${port}` : addr;
  }

  start() {
    if (!window.sharingAPI) return;
    try { window.sharingAPI.startDiscovery(); } catch (_) {}
    this.refresh();
    if (!this._timer) this._timer = setInterval(() => this.refresh(), PeerDiscovery.INTERVAL_MS);
  }

  stop() {
    if (this._timer) { clearInterval(this._timer); this._timer = null; }
  }

  clear() {
    if (this._el) this._el.innerHTML = '';
  }

  async refresh() {
    if (!this._el || !window.sharingAPI) return;
    try {
      this._el.innerHTML = PeerDiscovery.html(await window.sharingAPI.getDiscovered());
    } catch (_) {}
  }

  static html(found) {
    if (!found || !found.length) {
      return '<div style="font-size:11px;color:var(--text-muted);">Searching for LumaBrowsers on your network...</div>';
    }
    const esc = HtmlEscaper.escape;
    return '<div style="font-size:11px;color:var(--text-muted);margin-bottom:2px;">Discovered on your network:</div>'
      + found.map((d) => `
            <div style="display:flex;gap:8px;align-items:center;font-size:11.5px;">
              <span style="flex:1;color:var(--text-secondary);">${esc(d.name)} <span style="color:var(--text-muted);">${esc(d.address || '')}:${esc(d.port || '')}</span></span>
              <button class="gs-copy-btn" data-new-peer-pick="${esc(d.address || '')}" data-new-peer-pick-port="${esc(d.port || '')}">Use</button>
            </div>`).join('');
  }
}
