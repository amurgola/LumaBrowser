const IpcSubscription = require('../../shared/ipc/IpcSubscription');

class PreloadSection {
  static build(_ipcRenderer, _webUtils) {
    throw new Error(`${this.name}.build is not implemented`);
  }

  static subscribe(ipcRenderer, channel, map) {
    return IpcSubscription.of(ipcRenderer, channel, map);
  }
}

module.exports = PreloadSection;
