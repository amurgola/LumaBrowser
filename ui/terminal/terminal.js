import { Terminal } from './vendor/xterm/lib/xterm.mjs';
import { FitAddon } from './vendor/addon-fit/lib/addon-fit.mjs';
import TerminalView from './TerminalView.js';

class TerminalTabPage {
  static AGENT_DRIVING = 'An AI agent is using this terminal. You can type at any time.';
  static USER_HOLDING = 'You have taken over. The agent can read this terminal but not type.';
  static MISSING_BRIDGE = 'This page must run inside a LumaBrowser terminal tab.';

  constructor(doc, bridge) {
    this._doc = doc;
    this._bridge = bridge;
    this._stage = doc.getElementById('termStage');
    this._banner = doc.getElementById('termBanner');
    this._bannerText = doc.getElementById('termBannerText');
    this._bannerButton = doc.getElementById('termBannerButton');
    this._session = null;
  }

  async start() {
    if (!this._bridge) return void (this._stage.textContent = TerminalTabPage.MISSING_BRIDGE);
    const settings = (await this._bridge.settings()) || {};
    this._view = new TerminalView(this._stage, {
      xterm: { Terminal, FitAddon }, transport: this._bridge, settings,
      hooks: { onSession: (session) => this._onSession(session), onExit: (session) => this._onExit(session), onClosed: () => this._bridge.closeTab() },
    });
    this._bannerButton.addEventListener('click', () => this._toggleHold());
    this._doc.defaultView.addEventListener('focus', () => this._view.focus());
    await this._view.start();
    this._view.focus();
  }

  _onSession(session) {
    this._session = session;
    this._doc.title = TerminalTabPage.titleFor(session);
    this._rememberInAddress(session);
    this._showBanner(session);
  }

  _onExit(session) {
    if (session.exitCode === 0) this._bridge.closeTab();
  }

  static titleFor(session) {
    const folder = session.cwd ? String(session.cwd).replace(/[\\/]+$/, '').split(/[\\/]/).pop() : '';
    const named = session.title && !/[\\/]/.test(session.title) ? session.title : '';
    const base = named || session.label || 'Terminal';
    return folder && !named ? `${base}: ${folder}` : base;
  }

  _rememberInAddress(session) {
    const query = new URLSearchParams();
    if (session.profileId) query.set('profile', session.profileId);
    if (session.cwd) query.set('cwd', session.cwd);
    const next = `${location.pathname}?${query.toString()}`;
    if (next !== `${location.pathname}${location.search}`) history.replaceState(null, '', next);
  }

  _showBanner(session) {
    this._banner.hidden = !session.agentActive || session.exited;
    this._bannerText.textContent = session.held ? TerminalTabPage.USER_HOLDING : TerminalTabPage.AGENT_DRIVING;
    this._bannerButton.textContent = session.held ? 'Hand back' : 'Take over';
  }

  async _toggleHold() {
    if (this._session) await this._bridge.hold(!this._session.held);
    this._view.focus();
  }
}

new TerminalTabPage(document, window.lumaTerminal).start();
