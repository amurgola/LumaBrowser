const fs = require('fs');
const path = require('path');
const IdeWebviewFiles = require('../ide/IdeWebviewFiles');
const WebviewAppBundler = require('../ide/WebviewAppBundler');

class IdePageInliner {
  static GRAMMAR_TAG = '<script>/*@@SHARED_TOOL_GRAMMAR@@*/';

  static build(root, bridgeScript = '') {
    const page = (name) => fs.readFileSync(path.join(root, IdeWebviewFiles.PAGE_DIR, name), 'utf8');
    const grammar = fs.readFileSync(path.join(root, IdeWebviewFiles.SHARED_FILES[0][0]), 'utf8');
    return page('index.html')
      .replace('/*@@CSS@@*/', () => page('luma.css'))
      .replace(IdePageInliner.GRAMMAR_TAG, () => `${bridgeScript}\n${IdePageInliner.GRAMMAR_TAG}`)
      .replace('/*@@SHARED_TOOL_GRAMMAR@@*/', () => IdePageInliner.guard(grammar))
      .replace('/*@@APP_JS@@*/', () => IdePageInliner.guard(WebviewAppBundler.bundle(root)));
  }

  static guard(source) {
    return source.replace(/<\/script/g, '<\\/script');
  }
}

module.exports = IdePageInliner;
