const fs = require('fs');
const path = require('path');
const CoreRequire = require('../CoreRequire');
const NoScrollbarStyle = require('../flatten/NoScrollbarStyle');

const ContainedPath = CoreRequire.load('shared/fs/ContainedPath');

class PlayRequest {
  static resolve(api, reqPath) {
    let rel;
    try { rel = decodeURIComponent(reqPath.replace(/^\/play\/?/, '')); } catch (_) { return { status: 400 }; }
    if (!rel || rel.indexOf('\0') !== -1) return { status: 400 };
    const slash = rel.indexOf('/');
    const root = PlayRequest._root(api, slash === -1 ? rel : rel.slice(0, slash));
    if (!root) return { status: 404 };
    const assetRel = slash === -1 ? '' : rel.slice(slash + 1);
    let file;
    try { file = ContainedPath.resolveWithin(root, assetRel || 'index.html'); } catch (_) { return { status: 403 }; }
    return { root, file, entry: path.relative(root, file).toLowerCase() === 'index.html' };
  }

  static async entryHtml(file) {
    try { return NoScrollbarStyle.apply(await fs.promises.readFile(file, 'utf8')); } catch (_) { return null; }
  }

  static _root(api, rawConv) {
    try {
      const root = api.gameDirFor(rawConv);
      return fs.existsSync(root) ? root : null;
    } catch (_) { return null; }
  }
}

module.exports = PlayRequest;
