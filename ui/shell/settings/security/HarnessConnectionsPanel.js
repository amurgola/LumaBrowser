import HtmlEscaper from '../../../../core/llm-server/ui/js/format/HtmlEscaper.js';

export default class HarnessConnectionsPanel {
  constructor({ feedback }) {
    this._feedback = feedback;
    this._busy = false;
  }

  install() {
    this._api = window.electronAPI;
    this._rows = document.getElementById('gsHarnessRows');
    const settingsBtn = document.getElementById('settingsBtn');
    if (!this._api || !this._api.harnessList || !this._rows || !settingsBtn) return;
    this._apiHint = document.getElementById('gsHarnessApiHint');
    this._skillStatus = document.getElementById('gsHarnessSkillStatus');
    this._rows.addEventListener('click', (ev) => this._onRowClick(ev));
    document.getElementById('gsHarnessSkillBtn')?.addEventListener('click', () => this._writeSkills());
    document.getElementById('gsHarnessExportLink')?.addEventListener('click', (ev) => this._export(ev));
    settingsBtn.addEventListener('click', () => this.load());
    this.load();
  }

  async load() {
    try {
      const r = await this._api.harnessList();
      if (r && r.success) this._render(r);
      else this._rows.innerHTML = '<div class="gs-row"><span class="gs-inline-error">' + HtmlEscaper.escape((r && r.error) || 'Could not read agent connections') + '</span></div>';
    } catch (e) { console.error('harness list failed:', e); }
  }

  static describe(h) {
    const connected = h.state === 'connected';
    let status = 'Detected';
    let cls = '';
    if (h.needsRepair) { status = 'Needs repair: ' + (h.reason || 'the config changed'); cls = 'warn'; }
    else if (h.state === 'unavailable') { status = h.reason || 'Config file could not be read'; cls = 'warn'; }
    else if (connected) { status = h.model ? ('Connected, model ' + h.model) : 'Connected'; cls = 'ok'; }
    else if (!h.installed) { status = 'Not detected on this computer'; }
    const label = h.needsRepair ? 'Reconnect' : connected ? 'Disconnect' : 'Connect';
    const action = (connected && !h.needsRepair) ? 'disconnect' : 'connect';
    return { status, cls, action, label };
  }

  static rowHtml(h) {
    const esc = HtmlEscaper.escape;
    const { status, cls, action, label } = HarnessConnectionsPanel.describe(h);
    const disabled = h.state === 'unavailable' ? 'disabled' : '';
    const color = cls === 'ok' ? ' style="color:var(--good);"' : cls === 'warn' ? ' style="color:var(--warn, #c98a00);"' : '';
    return '<div class="gs-row" data-harness="' + esc(h.id) + '">'
      + '<span class="gs-row-label">' + esc(h.name) + '</span>'
      + '<div style="display:flex;gap:8px;flex:1;align-items:center;flex-wrap:wrap;">'
      + '<button class="btn btn-secondary btn-sm" data-action="' + action + '" ' + disabled + '>' + label + '</button>'
      + '<span class="gs-row-help' + (cls ? ' gs-harness-' + cls : '') + '"' + color + '>' + esc(status) + '</span>'
      + '</div></div>';
  }

  static disconnectMessage(r) {
    const kept = (r && r.kept) || [];
    if (!kept.length) return 'Disconnected';
    return 'Disconnected. Kept ' + kept.length + (kept.length === 1 ? ' setting' : ' settings') + ' you changed: ' + kept.map((k) => k.path).join(', ');
  }

  static skillText(skills) {
    const n = skills.filter((s) => s.installed).length;
    if (n === skills.length && n > 0) return 'Installed for Claude Code and shared agent skills';
    return n > 0 ? 'Partly installed' : 'Teaches agents to read luma docs';
  }

  _render(data) {
    this._rows.innerHTML = ((data && data.harnesses) || []).map((h) => HarnessConnectionsPanel.rowHtml(h)).join('');
    if (this._apiHint) {
      this._apiHint.textContent = data && data.localApiEnabled === false
        ? 'Turn on "Serve on 127.0.0.1" above first; connected agents talk to that port.'
        : '';
    }
    if (this._skillStatus) this._skillStatus.textContent = HarnessConnectionsPanel.skillText((data && data.skills) || []);
  }

  async _onRowClick(ev) {
    const btn = ev.target.closest('button[data-action]');
    if (!btn || this._busy) return;
    const row = btn.closest('[data-harness]');
    const id = row && row.getAttribute('data-harness');
    if (!id) return;
    this._busy = true;
    btn.disabled = true;
    const disconnect = btn.getAttribute('data-action') === 'disconnect';
    try {
      const r = disconnect ? await this._api.harnessDisconnect(id) : await this._api.harnessConnect(id);
      if (r && r.success) this._feedback.toast(disconnect ? HarnessConnectionsPanel.disconnectMessage(r) : 'Connected. Restart the agent to pick it up.', 'ok');
      else this._feedback.toast((r && r.error) || 'Could not change the connection', 'bad');
    } finally {
      this._busy = false;
      await this.load();
    }
  }

  async _writeSkills() {
    const r = await this._api.harnessWriteSkills();
    if (r && r.success) this._feedback.toast('luma skill installed', 'ok');
    else this._feedback.toast((r && r.error) || 'Could not install the skill', 'bad');
    await this.load();
  }

  async _export(ev) {
    ev.preventDefault();
    const result = await this._api.exportMcpConfig();
    if (result && result.success) this._feedback.toast('MCP config exported to ' + result.filePath, 'ok');
    else if (result && !result.canceled) this._feedback.toast(result.error || 'Export failed', 'bad');
  }
}
