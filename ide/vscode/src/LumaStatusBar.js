'use strict';

const vscode = require('vscode');
const SessionStatus = require('./SessionStatus');

class LumaStatusBar {
  static MODEL_CHARS = 28;

  constructor(session, focusCommand) {
    this._session = session;
    this.item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 90);
    this.item.command = focusCommand;
    session.on('state', () => this.paint());
    this.paint();
    this.item.show();
  }

  static text(session) {
    if (session.status === SessionStatus.READY) return session.streaming ? 'working' : LumaStatusBar._model(session);
    if (session.status === SessionStatus.STARTING) return 'starting…';
    if (session.status === SessionStatus.CONNECTING) return 'connecting…';
    return 'offline';
  }

  static tooltip(session) {
    if (session.statusMessage) return session.statusMessage;
    if (session.status !== SessionStatus.READY) return 'LumaBrowser is not connected. Click to open Luma.';
    return `LumaBrowser${session.agent ? ` · ${session.agent.name}` : ''}${session.model ? ` · ${session.model}` : ''}`;
  }

  paint() {
    this.item.text = `Luma: ${LumaStatusBar.text(this._session)}`;
    this.item.tooltip = LumaStatusBar.tooltip(this._session);
    vscode.commands.executeCommand('setContext', 'luma.streaming', !!this._session.streaming);
  }

  static _model(session) {
    return session.model ? String(session.model).split('::').pop().slice(0, LumaStatusBar.MODEL_CHARS) : 'ready';
  }
}

module.exports = LumaStatusBar;
