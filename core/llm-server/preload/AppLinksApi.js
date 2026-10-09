const PreloadSection = require('./PreloadSection');

class AppLinksApi extends PreloadSection {
  static build(ipcRenderer) {
    return {
      openAppSettings: (tab) => ipcRenderer.invoke('core.shell.openSettings', tab),
      apiSecurity: {
        get: () => ipcRenderer.invoke('core.settings.apiSecurity.get'),
      },
      getPersona: () => ipcRenderer.invoke('core.settings.getPersona'),
      debug: {
        getLogs: () => ipcRenderer.invoke('core.debug.getLogs'),
      },
      rpLab: AppLinksApi._rpLab(ipcRenderer),
    };
  }

  static _rpLab(ipcRenderer) {
    return {
      getScenario: () => ipcRenderer.invoke('core.rpLab.getScenario'),
      run: (args) => ipcRenderer.invoke('core.rpLab.run', args || {}),
      regenerateFrom: (args) => ipcRenderer.invoke('core.rpLab.regenerateFrom', args || {}),
      regenerateStep: (args) => ipcRenderer.invoke('core.rpLab.regenerateStep', args || {}),
      onEvent: PreloadSection.subscribe(ipcRenderer, 'core.rpLab.event'),
    };
  }
}

module.exports = AppLinksApi;
