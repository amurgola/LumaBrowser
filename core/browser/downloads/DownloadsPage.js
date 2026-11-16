const path = require('path');
const { pathToFileURL } = require('url');

class DownloadsPage {
  static HOST = 'downloads';
  static URL = 'luma://downloads/';
  static TITLE = 'Downloads';
  static DIR = path.join(__dirname, '..', '..', '..', 'ui', 'downloads');
  static INDEX = 'downloads.html';

  static isDownloads(url) {
    return /^luma:\/\/downloads(\/|$)/i.test(String(url || ''));
  }

  static routes() {
    return [{ match: { host: DownloadsPage.HOST }, source: { type: 'directory', root: DownloadsPage.DIR, index: DownloadsPage.INDEX } }];
  }

  static serve(url, fetchFile) {
    const file = DownloadsPage._fileFor(url);
    return file ? fetchFile(pathToFileURL(file).href) : new Response('Not found', { status: 404 });
  }

  static _fileFor(url) {
    let parsed;
    try { parsed = new URL(url); } catch (_) { return null; }
    if (parsed.hostname !== DownloadsPage.HOST) return null;
    const name = decodeURIComponent(parsed.pathname).replace(/^\//, '') || DownloadsPage.INDEX;
    const file = path.resolve(DownloadsPage.DIR, name);
    return file.startsWith(DownloadsPage.DIR + path.sep) ? file : null;
  }
}

module.exports = DownloadsPage;
