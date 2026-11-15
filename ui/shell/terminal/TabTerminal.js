import TerminalView from '../../terminal/TerminalView.js';
import DockTransport from './DockTransport.js';

export default class TabTerminal {
  constructor({ tabId, ipc, doc, parent, hooks }) {
    this.tabId = tabId;
    this.open = true;
    this.session = null;
    this._ipc = ipc;
    this._hooks = hooks;
    this._element = doc.createElement('div');
    this._element.className = 'terminal-dock-term';
    parent.appendChild(this._element);
    this._view = null;
    this._transport = null;
  }

  get sessionId() {
    return this._transport ? this._transport.sessionId : null;
  }

  async start(xterm, settings, profileId) {
    this._transport = new DockTransport(this._ipc, { profileId, besideTabId: this.tabId });
    this._view = new TerminalView(this._element, {
      xterm, transport: this._transport, settings,
      hooks: { onSession: (session) => this._onSession(session), onExit: (session) => this._onExit(session), onClosed: () => this._hooks.onEnded() },
    });
    await this._view.start();
  }

  setVisible(visible) {
    this._element.hidden = !visible;
  }

  focus() {
    if (this._view) this._view.focus();
  }

  async end({ closeSession }) {
    const id = this.sessionId;
    if (this._view) this._view.dispose();
    if (this._transport) this._transport.dispose();
    this._view = null;
    this._transport = null;
    this._element.remove();
    if (closeSession && id) await this._ipc.invoke('core.terminal.close', { id });
  }

  _onSession(session) {
    this.session = session;
    this._hooks.onSession(session);
  }

  _onExit(session) {
    if (session.exitCode === 0) this._hooks.onEnded();
  }
}
