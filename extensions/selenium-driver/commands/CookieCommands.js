const WebDriverCommandGroup = require('./WebDriverCommandGroup');
const WebDriverError = require('../WebDriverError');

class CookieCommands extends WebDriverCommandGroup {
  static READ_SCRIPT = `
    document.cookie.split(';').filter(Boolean).map(p => {
      const eq = p.indexOf('=');
      return { name: p.slice(0, eq).trim(), value: p.slice(eq + 1).trim(), domain: location.hostname, path: '/' };
    })
  `;

  static EXPIRED = 'expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/';

  commandNames() {
    return ['getAllCookies', 'getNamedCookie', 'addCookie', 'deleteCookie', 'deleteAllCookies'];
  }

  async getAllCookies(session) {
    return (await this._page.run(session.tabId, CookieCommands.READ_SCRIPT)) || [];
  }

  async getNamedCookie(session, params) {
    const cookie = (await this.getAllCookies(session)).find((c) => c.name === params.name);
    if (!cookie) throw WebDriverError.noSuchCookie(`no cookie named ${params.name}`);
    return cookie;
  }

  async addCookie(session, _params, req) {
    const { cookie } = CookieCommands._body(req);
    if (!cookie || !cookie.name) throw WebDriverError.invalidArgument('cookie.name required');
    await this._page.run(session.tabId, `document.cookie=${JSON.stringify(CookieCommands._cookieString(cookie))}`);
    return null;
  }

  async deleteCookie(session, params) {
    await this._page.run(session.tabId, `document.cookie=${JSON.stringify(`${params.name}=; ${CookieCommands.EXPIRED}`)}`);
    return null;
  }

  async deleteAllCookies(session) {
    for (const cookie of await this.getAllCookies(session)) await this.deleteCookie(session, { name: cookie.name });
    return null;
  }

  static _cookieString(cookie) {
    const nameValue = `${encodeURIComponent(cookie.name)}=${encodeURIComponent(cookie.value || '')}`;
    const path = cookie.path ? `;path=${cookie.path}` : '';
    const expiry = cookie.expiry ? `;expires=${new Date(cookie.expiry * 1000).toUTCString()}` : '';
    return nameValue + path + expiry;
  }
}

module.exports = CookieCommands;
