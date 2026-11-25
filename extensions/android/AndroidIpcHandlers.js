class AndroidIpcHandlers {
  static register(ipc, { devices, tabs, settings }) {
    const answer = (work) => async (event, ...args) => {
      try {
        return { success: true, data: await work(...args) };
      } catch (error) {
        return { success: false, error: error.message };
      }
    };
    ipc.handle('overview', answer(async () => ({ ...(await devices.overview()), settings: settings.read() })));
    ipc.handle('saveSettings', answer((patch) => settings.save(patch)));
    ipc.handle('start', answer((name) => devices.start(String(name))));
    ipc.handle('stop', answer((name) => devices.stop(String(name))));
    ipc.handle('create', answer(() => devices.create()));
    ipc.handle('open', answer((name, options) => tabs.open(String(name), options || {})));
  }
}

module.exports = AndroidIpcHandlers;
