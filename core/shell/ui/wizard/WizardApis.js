export default class WizardApis {
  static invoke(channel, ...args) {
    return window.ipcBridge.invoke(channel, ...args);
  }

  static llm() {
    const inv = WizardApis.invoke;
    return {
      getRuntimesView: () => inv('core.llmServer.getRuntimesView'),
      installRuntime: (id) => inv('core.llmServer.installRuntime', id),
      downloadModel: (spec) => inv('core.llmServer.downloadModel', spec),
      setDefaults: (d) => inv('core.llmServer.setDefaults', d),
      startServer: () => inv('core.llmServer.startServer'),
      setEnabled: (v) => inv('core.llmServer.setEnabled', v),
      setOpenTabOnLoad: (v) => inv('core.llmServer.setOpenTabOnLoad', v),
      getRamPinStatus: () => inv('core.llmServer.getRamPinStatus'),
      onRuntimeEvent: (cb) => window.ipcBridge.on('core.llmServer.runtimeEvent', cb),
      onModelEvent: (cb) => window.ipcBridge.on('core.llmServer.modelEvent', cb),
    };
  }

  static llmImport() {
    return { ...WizardApis.llm(), importExistingModel: (args) => WizardApis.invoke('core.llmServer.importExistingModel', args) };
  }

  static image() {
    const inv = WizardApis.invoke;
    return {
      getRuntimesView: () => inv('core.imageServer.getRuntimesView'),
      modelCatalog: () => inv('core.imageServer.modelCatalog'),
      installRuntime: (id) => inv('core.imageServer.installRuntime', id),
      downloadModel: (spec) => inv('core.imageServer.downloadModel', spec),
      setDefaults: (d) => inv('core.imageServer.setDefaults', d),
      setEnabled: (v) => inv('core.imageServer.setEnabled', v),
      startServer: () => inv('core.imageServer.startServer'),
      onRuntimeEvent: (cb) => window.ipcBridge.on('core.imageServer.runtimeEvent', cb),
      onModelEvent: (cb) => window.ipcBridge.on('core.imageServer.modelEvent', cb),
      importExistingModel: (args) => inv('core.imageServer.importExistingModel', args),
    };
  }

  static music() {
    const inv = WizardApis.invoke;
    return {
      getView: (opts) => inv('core.musicServer.getView', opts || {}),
      installRuntime: (id) => inv('core.musicServer.installRuntime', id),
      downloadModel: (modelId) => inv('core.musicServer.downloadModel', modelId),
      setDefaults: (d) => inv('core.musicServer.setDefaults', d),
      setEnabled: (v) => inv('core.musicServer.setEnabled', v),
      onRuntimeEvent: (cb) => window.ipcBridge.on('core.musicServer.runtimeEvent', cb),
      onModelEvent: (cb) => window.ipcBridge.on('core.musicServer.modelEvent', cb),
    };
  }

  static placement() {
    return { setConfig: (patch) => WizardApis.invoke('core.placement.setConfig', patch) };
  }

  static system() {
    return { checkSystemLibraries: () => WizardApis.invoke('core.llmServer.checkSystemLibraries') };
  }

  static all() {
    return { llm: WizardApis.llm(), image: WizardApis.image(), music: WizardApis.music(), placement: WizardApis.placement(), system: WizardApis.system() };
  }

  static cancelDownload(server) {
    try { Promise.resolve(WizardApis.invoke(`core.${server}.cancelModelDownload`)).catch(() => {}); } catch (_) {}
  }
}
