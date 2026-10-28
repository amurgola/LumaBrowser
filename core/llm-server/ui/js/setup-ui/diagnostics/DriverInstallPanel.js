import Clipboard from '../../dom/Clipboard.js';
import HtmlEscaper from '../../format/HtmlEscaper.js';
import StatusLine from '../StatusLine.js';

export default class DriverInstallPanel {
  static ID = 'driverInstallPanel';
  static HOST_ID = 'gpuBody';
  static COPIED_MS = 1500;
  static WAITING = 'A terminal window is opening. Enter your sudo password there and wait for it to finish; this page updates when it is done.';

  constructor({ api, doc = document, reload }) {
    this._api = api || null;
    this._doc = doc;
    this._reload = reload || (() => {});
  }

  async render() {
    this._remove();
    if (!this._api || typeof this._api.getDriverInstallPlan !== 'function') return;
    let res;
    try { res = await this._api.getDriverInstallPlan(); } catch (_) { return; }
    const plan = res && res.success ? res.plan : null;
    const host = this._doc.getElementById(DriverInstallPanel.HOST_ID);
    if (!plan || !plan.applicable || !host) return;
    this._remove();
    const el = this._doc.createElement('div');
    el.id = DriverInstallPanel.ID;
    el.className = 'gpu-item driver-install';
    el.innerHTML = DriverInstallPanel.html(plan);
    host.appendChild(el);
  }

  static html(plan) {
    const esc = HtmlEscaper.escape;
    const pieces = plan.pieces.map((p) => `
                        <li><strong>${esc(p.label)}</strong>: ${esc(p.why)}
                            ${p.packages ? `<span class="muted-inline">Package${p.packages.length === 1 ? '' : 's'}: <code>${esc(p.packages.join(' '))}</code></span>` : '<span class="muted-inline">No package on this distribution; see the notes below.</span>'}
                        </li>`).join('');
    const notes = plan.notes.map((n) => `<li>${esc(n)}</li>`).join('');
    return `
                    <div class="gpu-head">
                        <span class="gpu-name">Intel compute drivers</span>
                        <span class="luma-badge warn">missing</span>
                    </div>
                    <div class="kv-list">
                        <p>LumaBrowser found Intel hardware whose compute drivers are not installed. This is what it would install, and why. Nothing runs until you click Install.</p>
                        <ul>${pieces}
                        </ul>
                        ${DriverInstallPanel._commandHtml(plan)}
                        ${notes ? `<ul class="driver-notes">${notes}</ul>` : ''}
                        ${DriverInstallPanel._actionsHtml(plan)}
                    </div>
                `;
  }

  static _commandHtml(plan) {
    const esc = HtmlEscaper.escape;
    if (!plan.command) return '';
    return `
                        <p><strong>What will happen:</strong> a terminal window opens on ${esc(plan.distro || 'this host')} and runs the command below with ${esc(plan.manager)}. sudo asks for your password in that window; LumaBrowser never sees it. The host is re-probed when it finishes.</p>
                        <pre data-driver-command>${esc(plan.command)}</pre>`;
  }

  static _actionsHtml(plan) {
    const install = plan.command ? '<button class="luma-btn primary luma-btn--sm" data-install-drivers>Install in a terminal</button>' : '';
    const copy = plan.command ? '<button class="luma-btn luma-btn--sm" data-copy-driver-cmd>Copy command</button>' : '';
    return `
                        <div class="gpu-health-actions">${install}${copy}<span class="gpu-health-status" data-driver-status></span></div>`;
  }

  async install(button) {
    const status = this._status(button);
    if (!this._api || typeof this._api.installDrivers !== 'function') { status('bad', 'installDrivers is unavailable.'); return; }
    button.disabled = true;
    status('working', DriverInstallPanel.WAITING);
    try {
      const res = await this._api.installDrivers();
      if (!res || !res.success || !res.ok) {
        status('bad', (res && res.error) || 'The install did not finish.');
        button.disabled = false;
        return;
      }
      status('ok', 'Installed: re-probing the host…');
      await this._reload();
    } catch (err) {
      status('bad', err.message || 'Unexpected failure');
      button.disabled = false;
    }
  }

  async copy(button) {
    const container = button.closest(`#${DriverInstallPanel.ID}`);
    const pre = container && container.querySelector('[data-driver-command]');
    if (!pre) return;
    const ok = await Clipboard.copyText(pre.textContent);
    const original = button.textContent;
    button.textContent = ok ? 'Copied' : 'Copy failed';
    setTimeout(() => { button.textContent = original; }, DriverInstallPanel.COPIED_MS);
  }

  _status(button) {
    const container = button.closest(`#${DriverInstallPanel.ID}`);
    return StatusLine.for(container && container.querySelector('[data-driver-status]'), 'gpu-health-status');
  }

  _remove() {
    const existing = this._doc.getElementById(DriverInstallPanel.ID);
    if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
  }
}
