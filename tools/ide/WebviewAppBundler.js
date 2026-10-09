const fs = require('fs');
const path = require('path');
const ModuleScriptBundler = require('../../core/llm-server/chat/ModuleScriptBundler');

class WebviewAppBundler {
  static ENTRY = 'ide/webview/ui/entry.js';

  static bundle(root, entry = WebviewAppBundler.ENTRY) {
    const readAsset = (urlPath) => fs.readFileSync(WebviewAppBundler._fileFor(root, urlPath), 'utf8');
    return new ModuleScriptBundler({ readAsset }).bundle('/' + entry);
  }

  static _fileFor(root, urlPath) {
    return path.join(root, decodeURIComponent(urlPath));
  }
}

module.exports = WebviewAppBundler;
