class MainWindowOptions {
  static WIDTH = 1400;
  static HEIGHT = 900;
  static BACKGROUND = '#0b1220';
  static SYMBOL_COLOR = '#8a95ad';
  static TITLE_BAR_HEIGHT = 40;

  static build({ platform = process.platform, startHidden = false, iconPath, preloadPath }) {
    const options = {
      width: MainWindowOptions.WIDTH,
      height: MainWindowOptions.HEIGHT,
      show: !startHidden,
      autoHideMenuBar: true,
      backgroundColor: MainWindowOptions.BACKGROUND,
      icon: iconPath,
      webPreferences: { nodeIntegration: false, contextIsolation: true, preload: preloadPath, zoomFactor: 1.0 },
    };
    return Object.assign(options, MainWindowOptions.titleBar(platform));
  }

  static titleBar(platform) {
    if (platform === 'darwin') return { titleBarStyle: 'hiddenInset', trafficLightPosition: { x: 12, y: 14 } };
    if (platform === 'linux') return { frame: false, titleBarStyle: 'hidden', transparent: true, backgroundColor: '#00000000' };
    return {
      frame: false,
      titleBarStyle: 'hidden',
      titleBarOverlay: { color: MainWindowOptions.BACKGROUND, symbolColor: MainWindowOptions.SYMBOL_COLOR, height: MainWindowOptions.TITLE_BAR_HEIGHT },
    };
  }
}

module.exports = MainWindowOptions;
