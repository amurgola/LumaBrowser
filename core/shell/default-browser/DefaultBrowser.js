const path = require('path');

class DefaultBrowser {
  static APP_NAME = 'LumaBrowser';
  static PROG_ID = 'LumaBrowserHTML';
  static FILE_TYPES = ['.htm', '.html', '.xhtml', '.shtml', '.svg'];
  static SCHEMES = ['http', 'https'];
  static LINUX_DESKTOP = 'lumabrowser.desktop';
  static SETTINGS_URI = 'ms-settings:defaultapps?registeredAppUser=LumaBrowser';
  static USER_CHOICE = 'HKCU\\Software\\Microsoft\\Windows\\Shell\\Associations\\UrlAssociations\\https\\UserChoice';

  constructor({ app, shell, run, env = process.env, platform = process.platform, execPath = process.execPath, appPath = null, isPackaged = true }) {
    this._app = app;
    this._shell = shell;
    this._run = run;
    this._env = env;
    this._platform = platform;
    this._execPath = execPath;
    this._appPath = appPath;
    this._isPackaged = isPackaged;
  }

  async status() {
    try {
      if (this._platform === 'win32') return { supported: true, isDefault: await this._windowsIsDefault(), platform: 'win32' };
      if (this._platform === 'darwin') return { supported: true, isDefault: DefaultBrowser.SCHEMES.every((s) => this._app.isDefaultProtocolClient(s)), platform: 'darwin' };
      if (this._platform === 'linux') {
        const { stdout } = await this._run('xdg-settings', ['get', 'default-web-browser']);
        return { supported: true, isDefault: String(stdout).trim() === DefaultBrowser.LINUX_DESKTOP, platform: 'linux' };
      }
    } catch (_) {}
    return { supported: this._platform === 'win32' || this._platform === 'darwin' || this._platform === 'linux', isDefault: false, platform: this._platform };
  }

  async makeDefault() {
    try {
      if (this._platform === 'win32') {
        await this.registerWindows();
        await this._shell.openExternal(DefaultBrowser.SETTINGS_URI);
        return { success: true, opened: 'settings' };
      }
      if (this._platform === 'darwin') {
        const ok = DefaultBrowser.SCHEMES.every((s) => this._app.setAsDefaultProtocolClient(s));
        return ok ? { success: true, opened: 'prompt' } : { success: false, error: 'macOS refused the request' };
      }
      if (this._platform === 'linux') {
        await this._run('xdg-settings', ['set', 'default-web-browser', DefaultBrowser.LINUX_DESKTOP]);
        return { success: true, opened: 'set' };
      }
      return { success: false, error: 'Not supported on this system' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  launchCommand() {
    const exe = this._env.PORTABLE_EXECUTABLE_FILE || this._execPath;
    const app = !this._isPackaged && this._appPath ? ` "${this._appPath}"` : '';
    return { exe, open: `"${exe}"${app} "%1"`, start: `"${exe}"${app}` };
  }

  registryEntries() {
    const { exe, open, start } = this.launchCommand();
    const n = DefaultBrowser.APP_NAME;
    const prog = `HKCU\\Software\\Classes\\${DefaultBrowser.PROG_ID}`;
    const client = `HKCU\\Software\\Clients\\StartMenuInternet\\${n}`;
    const caps = `${client}\\Capabilities`;
    const icon = `"${exe}",0`;
    const entries = [
      [prog, null, `${n} HTML Document`],
      [prog, 'FriendlyTypeName', `${n} HTML Document`],
      [`${prog}\\Application`, 'ApplicationName', n],
      [`${prog}\\Application`, 'ApplicationIcon', icon],
      [`${prog}\\DefaultIcon`, null, icon],
      [`${prog}\\shell\\open\\command`, null, open],
      [client, null, n],
      [`${client}\\DefaultIcon`, null, icon],
      [`${client}\\shell\\open\\command`, null, start],
      [caps, 'ApplicationName', n],
      [caps, 'ApplicationDescription', 'A web browser with a local AI built in'],
      [caps, 'ApplicationIcon', icon],
      [`${caps}\\StartMenu`, 'StartMenuInternet', n],
      ['HKCU\\Software\\RegisteredApplications', n, `Software\\Clients\\StartMenuInternet\\${n}\\Capabilities`],
    ];
    for (const s of DefaultBrowser.SCHEMES) entries.push([`${caps}\\URLAssociations`, s, DefaultBrowser.PROG_ID]);
    for (const t of DefaultBrowser.FILE_TYPES) entries.push([`${caps}\\FileAssociations`, t, DefaultBrowser.PROG_ID]);
    return entries;
  }

  async registerWindows() {
    for (const [key, name, data] of this.registryEntries()) {
      const args = ['add', key, ...(name == null ? ['/ve'] : ['/v', name]), '/t', 'REG_SZ', '/d', data, '/f'];
      await this._run('reg', args);
    }
  }

  async unregisterWindows() {
    const n = DefaultBrowser.APP_NAME;
    const deletes = [
      ['delete', `HKCU\\Software\\Classes\\${DefaultBrowser.PROG_ID}`, '/f'],
      ['delete', `HKCU\\Software\\Clients\\StartMenuInternet\\${n}`, '/f'],
      ['delete', 'HKCU\\Software\\RegisteredApplications', '/v', n, '/f'],
    ];
    for (const args of deletes) { try { await this._run('reg', args); } catch (_) {} }
  }

  async _windowsIsDefault() {
    try {
      const { stdout } = await this._run('reg', ['query', DefaultBrowser.USER_CHOICE, '/v', 'ProgId']);
      return new RegExp(`ProgId\\s+REG_SZ\\s+${DefaultBrowser.PROG_ID}\\b`).test(String(stdout));
    } catch (_) {
      return false;
    }
  }

  static fileTypeOf(file) {
    return path.extname(String(file || '')).toLowerCase();
  }
}

module.exports = DefaultBrowser;
