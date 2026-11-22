const PreloadSection = require('./PreloadSection');

class LlmRuntimeApi extends PreloadSection {
  static build(ipcRenderer) {
    return {
      getRuntimesView: (opts) => ipcRenderer.invoke('core.llmServer.getRuntimesView', opts || null),
      getFrameworksView: () => ipcRenderer.invoke('core.llmServer.getFrameworksView'),
      setActiveBuild: (frameworkId, runtimeId) => ipcRenderer.invoke('core.llmServer.setActiveBuild', frameworkId, runtimeId || null),
      setFormatFramework: (format, frameworkId) => ipcRenderer.invoke('core.llmServer.setFormatFramework', format, frameworkId || null),
      setModelFramework: (modelPath, frameworkId) => ipcRenderer.invoke('core.llmServer.setModelFramework', modelPath, frameworkId || null),
      setFrameworkOption: (frameworkId, optionId, value) =>
        ipcRenderer.invoke('core.llmServer.setFrameworkOption', frameworkId, optionId, value === undefined ? null : value),
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
