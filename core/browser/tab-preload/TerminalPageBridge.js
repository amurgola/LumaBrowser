class TerminalPageBridge {
  static install(contextBridge, ipcRenderer, win) {
    if (!contextBridge || !win || !win.location) return false;
    if (win.location.protocol !== 'luma:' || win.location.hostname !== 'terminal') return false;
    contextBridge.exposeInMainWorld('lumaTerminal', {
      attach: (size) => ipcRenderer.invoke('core.terminal.attach', { size }),
      restart: (size) => ipcRenderer.invoke('core.terminal.restart', { size }),
      hold: (held) => ipcRenderer.invoke('core.terminal.hold', { held: !!held }),
      settings: () => ipcRenderer.invoke('core.terminal.settings'),
      input: (data) => { ipcRenderer.invoke('core.terminal.input', { data: String(data) }); },
      resize: (cols, rows) => { ipcRenderer.invoke('core.terminal.resize', { cols, rows }); },
      ack: (chars) => { ipcRenderer.invoke('core.terminal.ack', { chars }); },
      closeTab: () => { ipcRenderer.invoke('core.terminal.closeTab'); },
      onEvent: (listener) => { ipcRenderer.on('core.terminal.event', (_event, payload) => listener(payload)); },
    });
    return true;
  }
}

module.exports = TerminalPageBridge;
