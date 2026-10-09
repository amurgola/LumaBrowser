class IpcSubscription {
  static payload(_event, payload) {
    return payload;
  }

  static of(ipcRenderer, channel, map = IpcSubscription.payload) {
    return (cb) => {
      const listener = (...args) => cb(map(...args));
      ipcRenderer.on(channel, listener);
      return () => ipcRenderer.removeListener(channel, listener);
    };
  }
}

module.exports = IpcSubscription;
