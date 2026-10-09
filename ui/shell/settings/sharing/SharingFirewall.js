export default class SharingFirewall {
  static RECHECK_MS = 600;

  constructor({ sharingApi }) {
    this._api = sharingApi;
    this._btn = document.getElementById('gsShareFirewallBtn');
    this._status = document.getElementById('gsShareFirewallStatus');
    this._note = document.getElementById('gsShareFirewallNote');
  }

  install() {
    if (!this._btn || !this._api.firewallAllow) return;
    this._btn.addEventListener('click', () => this._allow());
    this.refresh();
  }

  static statusFor(s) {
    if (s.platform === 'win32' && s.ruleInstalled === true && !s.publicNetwork) return ['Allowed', 'luma-badge ok'];
    if (s.publicNetwork) return ['Blocked: network profile is Public', 'luma-badge warn'];
    return ['', ''];
  }

  async refresh() {
    if (!this._status || !this._api.firewallStatus) return;
    try {
      const s = await this._api.firewallStatus();
      if (!s) return;
      if (this._note && s.advice) this._note.textContent = s.advice;
      this._setStatus(...SharingFirewall.statusFor(s));
    } catch (_) {}
  }

  async _allow() {
    const old = this._btn.textContent;
    this._btn.disabled = true;
    this._btn.textContent = 'Requesting...';
    this._setStatus('', '');
    try {
      const r = await this._api.firewallAllow();
      if (r && r.success) this._setStatus('Allowed', 'luma-badge ok');
      else if (r && r.manual) this._setStatus(r.manual, 'gs-row-help');
      else this._setStatus((r && r.error) || 'Could not update the firewall.', 'gs-inline-error');
    } catch (e) {
      this._setStatus((e && e.message) || 'Failed.', 'gs-inline-error');
    } finally {
      this._btn.disabled = false;
      this._btn.textContent = old;
      setTimeout(() => this.refresh(), SharingFirewall.RECHECK_MS);
    }
  }

  _setStatus(text, className) {
    if (!this._status) return;
    this._status.textContent = text;
    this._status.className = className;
  }
}
