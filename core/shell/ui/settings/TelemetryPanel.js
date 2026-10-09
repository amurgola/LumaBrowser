import HtmlEscaper from '../../../llm-server/ui/js/format/HtmlEscaper.js';
import ShellHooks from './ShellHooks.js';

export default class TelemetryPanel {
  static STATUS_CHANNEL = 'core.telemetry.getStatus';

  constructor(container, hooks) {
    this._container = container;
    this._hooks = hooks;
  }

  static checkInText(status) {
    const devMode = !!status.developerMode;
    if (status.allowed && !devMode) return 'On';
    if (devMode) return 'Off (development build)';
    return status.optOut ? 'Off (your choice)' : 'Off';
  }

  async load() {
    if (!this._container || !window.ipcBridge) return;
    const status = (await window.ipcBridge.invoke(TelemetryPanel.STATUS_CHANNEL)) || {};
    this._container.innerHTML = TelemetryPanel._html(status);
    this._container.querySelector('#licRerunSetupBtn').addEventListener('click', () => this._rerunSetup());
  }

  static _html(status) {
    const esc = HtmlEscaper.escape;
    const devMode = !!status.developerMode;
    const checkInOn = !!status.allowed && !devMode;
    return `
      <div style="max-width: 520px;">
        <div class="luma-field">
          <div style="display:flex; align-items:center; gap:10px; margin-bottom:16px;">
            <span class="luma-dot ${devMode ? 'ok' : ''}" style="width:10px;height:10px;"></span>
            <span style="font-size:16px; font-weight:600;">${esc(devMode ? 'Developer Mode' : 'Community (Free)')}</span>
            ${devMode ? `<span class="luma-badge accent">Debug build</span>` : ''}
          </div>
          ${devMode ? `<div class="luma-muted" style="margin:0 0 8px;">Running a local development build. The lumabyte.com check-in is disabled for this session.</div>` : ''}
        </div>

        <div class="luma-kv gs-item-card" style="padding:12px 16px; margin-bottom:16px;">
          <div class="luma-kv-row" style="align-items:center;">
            <span class="luma-kv-key" style="min-width:150px;">Anonymous check-in</span>
            <span class="luma-badge ${checkInOn ? 'ok' : 'muted'}">${esc(TelemetryPanel.checkInText(status))}</span>
            <button type="button" class="luma-btn link gs-inline-link" data-gs-goto="general" style="margin-left:auto;">Change in General</button>
          </div>
        </div>

        <div class="luma-form-actions ext-form-buttons--start ext-mt-12">
          <button class="luma-btn" id="licRerunSetupBtn">Re-run first-run setup</button>
        </div>
      </div>
    `;
  }

  _rerunSetup() {
    ShellHooks.hideSettingsModal();
    this._hooks.rerunSetupWizard();
  }
}
