const { ipcMain } = require('electron');
const TerminalPage = require('./TerminalPage');

class TerminalIpcHandlers {
  constructor({ viewers, service, settings, getTabViewManager, ipc = ipcMain }) {
    this._viewers = viewers;
    this._service = service;
    this._settings = settings;
    this._tvm = getTabViewManager || (() => null);
    this._ipc = ipc;
  }

  register() {
    this._ipc.handle('core.terminal.attach', (event, payload) => this._attach(event, payload || {}));
    this._ipc.handle('core.terminal.restart', (event, payload) => this._onSession(event, payload, (id, p) => this._viewers.restart(event.sender, id, p.size)));
    this._ipc.handle('core.terminal.hold', (event, payload) => this._onSession(event, payload, (id, p) => this._service.setHeld(id, !!p.held)));
    this._ipc.handle('core.terminal.profiles', (event) => (this._caller(event) ? this._profiles() : null));
    this._ipc.handle('core.terminal.settings', (event) => (this._caller(event) ? this._settings.view() : null));
    this._ipc.handle('core.terminal.list', (event) => (this._caller(event) === 'chrome' ? this._service.list() : null));
    this._ipc.handle('core.terminal.openTab', (event, payload) => (this._caller(event) === 'chrome' ? this._viewers.openTab(payload || {}) : null));
    this._ipc.handle('core.terminal.close', (event, payload) => (this._caller(event) === 'chrome' ? this._service.close(payload && payload.id) : null));
    this._ipc.handle('core.terminal.setSettings', (event, patch) => (this._caller(event) === 'chrome' ? this._settings.update(patch) : null));
    this._ipc.handle('core.terminal.input', (event, payload) => this._onSession(event, payload, (id, p) => this._service.write(id, p.data)));
    this._ipc.handle('core.terminal.resize', (event, payload) => this._onSession(event, payload, (id, p) => this._service.resize(id, p)));
    this._ipc.handle('core.terminal.ack', (event, payload) => this._onSession(event, payload, (id, p) => this._service.ack(id, p.chars)));
    this._ipc.handle('core.terminal.closeTab', (event) => (this._caller(event) === 'page' ? this._viewers.closeTabOf(event.sender) : null));
  }

  _attach(event, payload) {
    const caller = this._caller(event);
    if (caller === 'page') return this._viewers.attachPage(event.sender, payload.size);
    if (caller === 'chrome') return this._viewers.attachDock(event.sender, payload);
    return null;
  }

  _onSession(event, payload, fn) {
    const caller = this._caller(event);
    if (!caller) return null;
    const data = payload || {};
    const id = this._viewers.sessionFor(event.sender, data.id, caller === 'chrome');
    return id ? fn(id, data) : null;
  }

  _caller(event) {
    const sender = event && event.sender;
    if (!sender) return null;
    try { if (TerminalPage.isTerminal(sender.getURL())) return 'page'; } catch (_) { return null; }
    const tvm = this._tvm();
    return tvm && typeof tvm.isChromeSender === 'function' && tvm.isChromeSender(sender) ? 'chrome' : null;
  }

  _profiles() {
    const registry = this._service.profiles;
    const chosen = registry.defaultProfile();
    return registry.list().map((profile) => ({ id: profile.id, label: profile.label, kind: profile.kind, isDefault: !!chosen && chosen.id === profile.id }));
  }
}

module.exports = TerminalIpcHandlers;
