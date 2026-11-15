const path = require('path');
const { pathToFileURL } = require('url');

class TerminalPage {
  static HOST = 'terminal';
  static URL = 'luma://terminal/';
  static TITLE = 'Terminal';
  static ROOT = path.join(__dirname, '..', '..');
  static DIR = path.join(TerminalPage.ROOT, 'ui', 'terminal');
  static INDEX = 'terminal.html';
  static VENDOR = Object.freeze({
    '/vendor/xterm/': path.join(TerminalPage.ROOT, 'node_modules', '@xterm', 'xterm'),
    '/vendor/addon-fit/': path.join(TerminalPage.ROOT, 'node_modules', '@xterm', 'addon-fit'),
  });

  static isTerminal(url) {
    return /^luma:\/\/terminal(\/|$)/i.test(String(url || ''));
  }

  static url({ profileId = null, cwd = null, sessionId = null } = {}) {
    const query = new URLSearchParams();
    if (sessionId) query.set('session', sessionId);
    if (profileId) query.set('profile', profileId);
    if (cwd) query.set('cwd', cwd);
    const text = query.toString();
    return text ? `${TerminalPage.URL}?${text}` : TerminalPage.URL;
  }

  static parse(url) {
    if (!TerminalPage.isTerminal(url)) return null;
    try {
      const query = new URL(url).searchParams;
      return { profileId: query.get('profile'), cwd: query.get('cwd'), sessionId: query.get('session') };
    } catch (_) {
      return { profileId: null, cwd: null, sessionId: null };
    }
  }

  static routes() {
    const vendor = Object.entries(TerminalPage.VENDOR).map(([prefix, root]) => ({
      match: { host: TerminalPage.HOST, path: prefix }, source: { type: 'directory', root },
    }));
    return [{ match: { host: TerminalPage.HOST }, source: { type: 'directory', root: TerminalPage.DIR, index: TerminalPage.INDEX } }, ...vendor];
  }

  static serve(url, fetchFile) {
    const file = TerminalPage._fileFor(url);
    return file ? fetchFile(pathToFileURL(file).href) : new Response('Not found', { status: 404 });
  }

  static _fileFor(url) {
    let parsed;
    try { parsed = new URL(url); } catch (_) { return null; }
    if (parsed.hostname !== TerminalPage.HOST) return null;
    const pathname = decodeURIComponent(parsed.pathname);
    const prefix = Object.keys(TerminalPage.VENDOR).find((candidate) => pathname.startsWith(candidate));
    const root = prefix ? TerminalPage.VENDOR[prefix] : TerminalPage.DIR;
    const rest = prefix ? pathname.slice(prefix.length) : pathname.replace(/^\//, '') || TerminalPage.INDEX;
    const file = path.resolve(root, rest);
    return file.startsWith(root + path.sep) ? file : null;
  }
}

module.exports = TerminalPage;
