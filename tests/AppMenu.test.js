const AppMenu = require('../app/ready/AppMenu');

const menu = () => ({ buildFromTemplate: jest.fn(() => 'menu'), setApplicationMenu: jest.fn() });
const app = (isPackaged) => ({ isPackaged, getVersion: () => '2.0.0', setAboutPanelOptions: jest.fn() });

test('identifies unpackaged macOS builds in the native About window', () => {
  const electronMenu = menu();
  const electronApp = app(false);
  expect(AppMenu.apply(electronMenu, 'darwin', console, electronApp)).toBe(true);
  expect(electronApp.setAboutPanelOptions).toHaveBeenCalledWith({
    applicationName: 'LumaBrowser Dev', applicationVersion: '2.0.0', credits: 'Unofficial development build',
  });
  expect(electronMenu.setApplicationMenu).toHaveBeenCalledWith('menu');
});

test('preserves packaged macOS About metadata', () => {
  const electronApp = app(true);
  AppMenu.apply(menu(), 'darwin', console, electronApp);
  expect(electronApp.setAboutPanelOptions).not.toHaveBeenCalled();
});

test.each(['linux', 'win32'])('does not configure macOS About metadata on %s', (platform) => {
  const electronApp = app(false);
  const electronMenu = menu();
  AppMenu.apply(electronMenu, platform, console, electronApp);
  expect(electronApp.setAboutPanelOptions).not.toHaveBeenCalled();
  expect(electronMenu.setApplicationMenu).toHaveBeenCalledWith(null);
});
