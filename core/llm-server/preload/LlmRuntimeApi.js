const PreloadSection = require('./PreloadSection');

class LlmRuntimeApi extends PreloadSection {
  static build(ipcRenderer) {
    return {
      getRuntimesView: (opts) => ipcRenderer.invoke('core.llmServer.getRuntimesView', opts || null),
      checkRuntimeUpdates: () => ipcRenderer.invoke('core.llmServer.checkRuntimeUpdates'),
      installRuntime: (id, opts) => ipcRenderer.invoke('core.llmServer.installRuntime', id, opts || null),
      getRuntimePrerelease: (id) => ipcRenderer.invoke('core.llmServer.getRuntimePrerelease', id),
      uninstallRuntime: (id) => ipcRenderer.invoke('core.llmServer.uninstallRuntime', id),
      pickRuntimeBinary: (id) => ipcRenderer.invoke('core.llmServer.pickRuntimeBinary', id),
      registerRuntimeBinary: (id, binaryPath) => ipcRenderer.invoke('core.llmServer.registerRuntimeBinary', id, binaryPath),
      locateRuntime: (id) => ipcRenderer.invoke('core.llmServer.locateRuntime', id),
      onRuntimeEvent: PreloadSection.subscribe(ipcRenderer, 'core.llmServer.runtimeEvent'),
      openExternal: (url) => ipcRenderer.invoke('core.shell.openExternal', url),
    };
  }
}

module.exports = LlmRuntimeApi;
