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
    return `
      <div class="about-hero">
        <span class="luma-dot ${devMode ? 'ok' : ''}"></span>
        <h3 class="about-name">${esc(devMode ? 'Developer mode' : 'Community (Free)')}</h3>
        ${devMode ? '<span class="luma-badge">Debug build</span>' : ''}
      </div>
      ${devMode ? '<p class="gs-group-desc">Running a local development build. The lumabyte.com check-in is disabled for this session.</p>' : ''}
      <section class="gs-subsection">
        <div class="gs-body">
          <div class="gs-row">
            <div class="gs-row-text">
              <span class="gs-row-label">Anonymous check-in</span>
              <span class="gs-row-help">${esc(TelemetryPanel.checkInText(status))}</span>
            </div>
            <button type="button" class="luma-btn ghost" data-gs-goto="general">Change in General</button>
          </div>
          <div class="gs-row">
            <div class="gs-row-text">
              <span class="gs-row-label">First-run setup</span>
              <span class="gs-row-help">Walk through the setup wizard again. Settings closes first.</span>
            </div>
            <button class="luma-btn" id="licRerunSetupBtn">Re-run setup</button>
          </div>
        </div>
      </section>
    `;
  }

  _rerunSetup() {
    ShellHooks.hideSettingsModal();
    this._hooks.rerunSetupWizard();
  }
}
