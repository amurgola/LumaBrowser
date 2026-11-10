const PreloadSection = require('./PreloadSection');

class AppLinksApi extends PreloadSection {
  static build(ipcRenderer) {
    return {
      openAppSettings: (tab) => ipcRenderer.invoke('core.shell.openSettings', tab),
      apiSecurity: {
        get: () => ipcRenderer.invoke('core.settings.apiSecurity.get'),
      },
      apiServer: {
        status: () => ipcRenderer.invoke('core.settings.getApiStatus'),
      },
      getPersona: () => ipcRenderer.invoke('core.settings.getPersona'),
      debug: {
        getLogs: () => ipcRenderer.invoke('core.debug.getLogs'),
      },
      rpLab: AppLinksApi._rpLab(ipcRenderer),
      palette: {
        record: (place) => ipcRenderer.invoke('core.palette.record', place),
        toggle: () => ipcRenderer.invoke('core.palette.toggle'),
        doubleShift: () => ipcRenderer.invoke('core.palette.getDoubleShift'),
      },
    };
  }

  static _rpLab(ipcRenderer) {
    return {
      getScenario: () => ipcRenderer.invoke('core.rpLab.getScenario'),
      run: (args) => ipcRenderer.invoke('core.rpLab.run', args || {}),
      regenerateFrom: (args) => ipcRenderer.invoke('core.rpLab.regenerateFrom', args || {}),
      regenerateStep: (args) => ipcRenderer.invoke('core.rpLab.regenerateStep', args || {}),
      runText: (args) => ipcRenderer.invoke('core.rpLab.runText', args || {}),
      onEvent: PreloadSection.subscribe(ipcRenderer, 'core.rpLab.event'),
    };
  }
}

module.exports = AppLinksApi;
