const { ipcMain } = require('electron');

class OnDemandIpc {
  static register(overlay) {
    OnDemandIpc._registerPanelChannels(overlay, (fn) => OnDemandIpc._ownOnly(overlay, fn));
    OnDemandIpc._registerShellChannels(overlay);
  }

  static _ownOnly(overlay, fn) {
    return (e, ...args) => (overlay.isOwnSender(e) ? fn(...args) : undefined);
  }

  static _registerPanelChannels(overlay, own) {
    ipcMain.on('on-demand:ready', own(() => overlay.markReady()));
    ipcMain.on('on-demand:drag', own((p) => overlay.drag(p && p.dx, p && p.dy)));
    ipcMain.on('on-demand:drag-end', own(() => overlay.dragEnd()));
    ipcMain.on('on-demand:set-expanded', own((p) => overlay.setExpanded(Boolean(p && p.expanded))));
    ipcMain.handle('on-demand:get-state', own(() => overlay.state()));
    ipcMain.handle('on-demand:history', own(() => overlay.history()));
    ipcMain.handle('on-demand:abort', own(() => overlay.abortTurn()));
    ipcMain.handle('on-demand:send', own((args) => overlay.sendTurn(args)));
  }

  static _registerShellChannels(overlay) {
    ipcMain.handle('on-demand:get-enabled', () => overlay.isEnabled());
    ipcMain.handle('on-demand:set-enabled', (_e, enabled) => {
      overlay.setEnabled(Boolean(enabled));
      return { success: true, enabled: overlay.isEnabled() };
    });
    ipcMain.handle('on-demand:get-tile', () => overlay.tileBounds());
  }
}

module.exports = OnDemandIpc;
