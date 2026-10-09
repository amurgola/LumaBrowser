import SharingFirewall from './SharingFirewall.js';
import SharingWebTools from './SharingWebTools.js';
import SharingTokensList from './SharingTokensList.js';
import SharingPeersList from './SharingPeersList.js';

export default class NetworkSharingPanel {
  static SHARE_FLAGS = {
    shareLocalLlm: 'gsShareLocalLlm', shareRemoteLlms: 'gsShareRemoteLlms',
    shareImageGen: 'gsShareImageGen', shareImageEdit: 'gsShareImageEdit',
    shareGpus: 'gsShareGpus', shareAgents: 'gsShareAgents', shareVoice: 'gsShareVoice',
  };

  constructor({ feedback, renderProviders }) {
    this._feedback = feedback;
    this._renderProviders = renderProviders;
  }

  install() {
    this._api = window.sharingAPI;
    this._enabled = document.getElementById('gsShareEnabled');
    if (!this._api || !document.getElementById('settingsBtn') || !this._enabled) return;
    this._el = NetworkSharingPanel._elements();
    this._buildParts();
    this._wireHost();
    document.addEventListener('settings:open', () => this._onSettingsOpen());
  }

  async loadHost() {
    try { this.applyHostConfig(await this._api.getHostConfig()); } catch (e) { console.error('sharing host load failed:', e); }
  }

  applyHostConfig(cfg) {
    if (!cfg) return;
    this._applyHostFields(cfg);
    this._applyWebFields(cfg);
    const summary = document.getElementById('gsShareSummary');
    if (summary) summary.textContent = NetworkSharingPanel.summary(cfg);
    this._webTools.render(cfg);
    this._tokens.render(cfg.tokens || []);
  }

  static summary(cfg) {
    const bits = [];
    if (cfg.enabled) bits.push(cfg.hasPin ? 'Sharing on' : 'Sharing on, no PIN');
    else bits.push('Off');
    if (cfg.webRunning) bits.push(`web on :${cfg.webPort}`);
    const paired = (cfg.tokens || []).filter((t) => !t.revoked).length;
    if (paired) bits.push(`${paired} paired`);
    return bits.join(', ');
  }

  static webHint(cfg) {
    if (cfg.webRunning) return [`Live: open http://<this PC's IP>:${cfg.webPort} on another device`, 'var(--good)'];
    if (cfg.webEnabled && !cfg.enabled) return ['Starts once the sharing host is enabled above.', 'var(--text-muted)'];
    return ['', null];
  }

  static _elements() {
    const $ = (id) => document.getElementById(id);
    return {
      name: $('gsShareName'), pin: $('gsSharePin'), pinStatus: $('gsSharePinStatus'), hostBody: $('gsShareHostBody'),
      webEnabled: $('gsShareWebEnabled'), webPort: $('gsShareWebPort'), webUrl: $('gsShareWebUrl'),
      publicUrl: $('gsSharePublicUrl'),
    };
  }

  _buildParts() {
    const sharingApi = this._api;
    this._firewall = new SharingFirewall({ sharingApi });
    this._webTools = new SharingWebTools({ sharingApi, feedback: this._feedback });
    this._tokens = new SharingTokensList({ sharingApi, reload: () => this.loadHost() });
    this._peers = new SharingPeersList({ sharingApi, renderProviders: this._renderProviders });
    this._firewall.install();
    this._webTools.install();
  }

  async _onSettingsOpen() {
    await this._webTools.refreshGloballyDisabled();
    this.loadHost();
    this._peers.load();
    try { this._api.startDiscovery(); } catch (_) {}
  }

  _applyHostFields(cfg) {
    const el = this._el;
    this._enabled.checked = !!cfg.enabled;
    if (el.name && document.activeElement !== el.name) el.name.value = cfg.instanceName || '';
    if (el.pinStatus) el.pinStatus.style.display = cfg.hasPin ? '' : 'none';
    if (el.hostBody) el.hostBody.style.opacity = cfg.enabled ? '1' : '0.65';
    const modeRadio = document.querySelector(`input[name="gsShareBindMode"][value="${cfg.bindMode || 'lan'}"]`);
    if (modeRadio) modeRadio.checked = true;
    for (const [flag, id] of Object.entries(NetworkSharingPanel.SHARE_FLAGS)) {
      const box = document.getElementById(id);
      if (box) box.checked = cfg[flag] !== false;
    }
  }

  _applyWebFields(cfg) {
    const el = this._el;
    if (el.webEnabled) el.webEnabled.checked = !!cfg.webEnabled;
    if (el.webPort && document.activeElement !== el.webPort) el.webPort.value = cfg.webPort || 80;
    if (el.publicUrl && document.activeElement !== el.publicUrl) el.publicUrl.value = cfg.webPublicUrl || '';
    if (!el.webUrl) return;
    const [text, color] = NetworkSharingPanel.webHint(cfg);
    el.webUrl.textContent = text;
    if (color) el.webUrl.style.color = color;
  }

  _wireHost() {
    const el = this._el;
    this._wireSwitch(this._enabled, (v) => this._api.setHostEnabled(v), 'Could not enable sharing.');
    if (el.name) el.name.addEventListener('change', () => this._saveName());
    document.getElementById('gsSharePinSet').addEventListener('click', () => this._setPin());
    document.getElementById('gsSharePinClear').addEventListener('click', () => this._clearPin());
    document.querySelectorAll('input[name="gsShareBindMode"]').forEach((radio) => {
      radio.addEventListener('change', () => this._saveBindMode(radio));
    });
    this._wireSwitch(el.webEnabled, (v) => this._api.setWebEnabled(v), 'Could not start the web backend.');
    this._wireField(el.webPort, () => this._api.setWebPort(parseInt(el.webPort.value, 10)), 'Invalid port.');
    this._wireField(el.publicUrl, () => this._api.setWebPublicUrl(el.publicUrl.value), 'Invalid URL.');
    for (const [flag, id] of Object.entries(NetworkSharingPanel.SHARE_FLAGS)) this._wireFlag(flag, document.getElementById(id));
    this._tokens.install();
    this._peers.install();
  }

  _wireSwitch(box, write, failure) {
    if (!box) return;
    box.addEventListener('change', async () => {
      const r = await write(box.checked);
      if (r && r.success === false) {
        box.checked = false;
        this._feedback.markSaved(box, false, r.error || failure);
      } else {
        this._feedback.markSaved(box, true);
      }
      if (r && r.config) this.applyHostConfig(r.config);
    });
  }

  _wireField(input, write, failure) {
    if (!input) return;
    input.addEventListener('change', async () => {
      const r = await write();
      if (r && r.success === false) this._feedback.markSaved(input, false, r.error || failure);
      else this._feedback.markSaved(input, true);
      if (r && r.config) this.applyHostConfig(r.config);
    });
  }

  _wireFlag(flag, box) {
    if (!box) return;
    box.addEventListener('change', async () => {
      try {
        const r = await this._api.setShareFlag(flag, box.checked);
        this._feedback.markSaved(box, !(r && r.success === false), r && r.error);
      } catch (e) { box.checked = !box.checked; this._feedback.markSaved(box, false, e.message); }
    });
  }

  _saveName() {
    const input = this._el.name;
    this._api.setInstanceName(input.value)
      .then((r) => {
        if (r && r.config) this.applyHostConfig(r.config);
        this._feedback.markSaved(input, !(r && r.success === false), r && r.error);
      })
      .catch((e) => this._feedback.markSaved(input, false, e.message));
  }

  async _setPin() {
    const pin = this._el.pin;
    const r = await this._api.setPin((pin.value || '').trim());
    if (r && r.success) {
      pin.value = '';
      this.applyHostConfig(r.config);
      this._feedback.markSaved(pin, true);
    } else {
      this._feedback.markSaved(pin, false, (r && r.error) || 'Enter 4 to 8 digits.');
    }
  }

  async _clearPin() {
    const r = await this._api.clearPin();
    if (r && r.config) this.applyHostConfig(r.config);
    this._feedback.markSaved(this._el.pin, true);
  }

  async _saveBindMode(radio) {
    if (!radio.checked) return;
    try {
      const r = await this._api.setBindMode(radio.value);
      this._feedback.markSaved(radio, !(r && r.success === false), r && r.error);
    } catch (e) { this._feedback.markSaved(radio, false, e.message); }
  }
}
