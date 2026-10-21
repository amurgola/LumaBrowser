const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ChromeExtensionManifest = require('../ChromeExtensionManifest');

class ChromeApiShim {
  static SHIM_FILE = 'luma-chrome-shim.js';
  static WORKER_FILE = 'luma-chrome-shim-worker.js';
  static WORKER_PREFIX = 'luma-chrome-shim-worker';
  static SOURCE = path.join(__dirname, 'chrome-api-shim.js');
  static SCRIPT_TAG = '<script src="/luma-chrome-shim.js"></script>';
  static PAGE_FIELDS = [
    ['action', 'default_popup'], ['browser_action', 'default_popup'], ['page_action', 'default_popup'],
    ['options_ui', 'page'], ['options_page'], ['side_panel', 'default_path'], ['devtools_page'],
    ['chrome_url_overrides', 'newtab'], ['chrome_url_overrides', 'history'], ['chrome_url_overrides', 'bookmarks'],
  ];

  static apply(dir) {
    const manifest = ChromeExtensionManifest.read(dir);
    fs.copyFileSync(ChromeApiShim.SOURCE, path.join(dir, ChromeApiShim.SHIM_FILE));
    const background = ChromeApiShim._shimBackground(dir, manifest);
    const pages = ChromeApiShim.pagesOf(manifest).filter((page) => ChromeApiShim._injectIntoPage(dir, page));
    fs.writeFileSync(path.join(dir, ChromeExtensionManifest.FILE_NAME), JSON.stringify(manifest, null, 2));
    return { background, pages };
  }

  static pagesOf(manifest) {
    const pages = ChromeApiShim.PAGE_FIELDS
      .map((fieldPath) => fieldPath.reduce((node, key) => (node && typeof node === 'object' ? node[key] : undefined), manifest))
      .filter((value) => typeof value === 'string' && value.trim());
    return [...new Set(pages.map((page) => page.trim()))];
  }

  static _shimBackground(dir, manifest) {
    const bg = manifest.background;
    if (!bg || typeof bg !== 'object') return null;
    if (typeof bg.service_worker === 'string' && bg.service_worker.trim()) {
      let original = bg.service_worker.trim().replace(/^\/+/, '');
      const previousWrapper = ChromeApiShim.isWrapper(original) ? original : null;
      if (previousWrapper) {
        original = ChromeApiShim._readTarget(path.join(dir, previousWrapper));
        if (!original) return 'worker';
      }
      const wrapper = path.posix.join(path.posix.dirname(original), ChromeApiShim.WORKER_FILE);
      fs.writeFileSync(path.join(dir, wrapper), ChromeApiShim.workerSource(original, bg.type === 'module'));
      if (previousWrapper && previousWrapper !== wrapper) fs.rmSync(path.join(dir, previousWrapper), { force: true });
      bg.service_worker = wrapper;
      return 'worker';
    }
    if (Array.isArray(bg.scripts)) {
      if (!bg.scripts.includes(ChromeApiShim.SHIM_FILE)) bg.scripts.unshift(ChromeApiShim.SHIM_FILE);
      return 'scripts';
    }
    if (typeof bg.page === 'string' && bg.page.trim()) {
      return ChromeApiShim._injectIntoPage(dir, bg.page.trim()) ? 'page' : null;
    }
    return null;
  }

  static workerSource(original, isModule) {
    const shim = `/${ChromeApiShim.SHIM_FILE}`;
    const target = `/${original}`;
    return isModule
      ? `import '${shim}';\nimport '${target}';\n`
      : `importScripts('${shim}', '${target}');\n`;
  }

  static isWrapper(file) {
    const name = path.posix.basename(String(file));
    return name.startsWith(ChromeApiShim.WORKER_PREFIX) && name.endsWith('.js');
  }

  static shimHash() {
    if (!ChromeApiShim._hash) {
      ChromeApiShim._hash = crypto.createHash('sha256').update(fs.readFileSync(ChromeApiShim.SOURCE)).digest('hex').slice(0, 16);
    }
    return ChromeApiShim._hash;
  }

  static wrappedTarget(source) {
    const paths = [...String(source).matchAll(/['"]\/([^'"]+)['"]/g)].map((m) => m[1]).filter((p) => p !== ChromeApiShim.SHIM_FILE);
    return paths.length ? paths[paths.length - 1] : null;
  }

  static _readTarget(file) {
    return fs.existsSync(file) ? ChromeApiShim.wrappedTarget(fs.readFileSync(file, 'utf8')) : null;
  }

  static _injectIntoPage(dir, page) {
    const relative = page.replace(/^\/+/, '').split(/[?#]/)[0];
    const file = path.resolve(dir, relative);
    if (!file.startsWith(path.resolve(dir) + path.sep) || !fs.existsSync(file)) return false;
    const html = fs.readFileSync(file, 'utf8');
    if (html.includes(ChromeApiShim.SHIM_FILE)) return true;
    fs.writeFileSync(file, ChromeApiShim.withScriptTag(html));
    return true;
  }

  static withScriptTag(html) {
    const tag = ChromeApiShim.SCRIPT_TAG;
    const head = /<head\b[^>]*>/i.exec(html);
    if (head) return `${html.slice(0, head.index + head[0].length)}${tag}${html.slice(head.index + head[0].length)}`;
    const script = /<script\b/i.exec(html);
    if (script) return `${html.slice(0, script.index)}${tag}${html.slice(script.index)}`;
    const doctype = /^\s*<!doctype[^>]*>/i.exec(html);
    const at = doctype ? doctype[0].length : 0;
    return `${html.slice(0, at)}${tag}${html.slice(at)}`;
  }
}

module.exports = ChromeApiShim;
