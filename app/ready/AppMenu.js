class AppMenu {
  static MAC_TEMPLATE = [{ role: 'appMenu' }, { role: 'editMenu' }, { role: 'windowMenu' }];

  static apply(Menu, platform = process.platform, log = console, app = null) {
    try {
      if (platform === 'darwin' && app && !app.isPackaged) {
        app.setAboutPanelOptions({
          applicationName: 'LumaBrowser Dev',
          applicationVersion: app.getVersion(),
          credits: 'Unofficial development build',
        });
      }
      Menu.setApplicationMenu(platform === 'darwin' ? Menu.buildFromTemplate(AppMenu.MAC_TEMPLATE) : null);
      return true;
    } catch (err) {
      log.warn('[main] setApplicationMenu failed:', err && err.message);
      return false;
    }
  }
}

module.exports = AppMenu;
