const path = require('path');
const GeneratedFileWriter = require('./GeneratedFileWriter');
const WebviewAppBundler = require('./WebviewAppBundler');

class IdeWebviewFiles {
  static PAGE_DIR = 'ide/webview';
  static PAGE_FILES = ['index.html', 'luma.css'];
  static APP_FILE = 'app.js';
  static SHARED_FILES = [['cli/lib/tui/ToolGrammar.js', 'tool-grammar.js']];

  static syncFiles(root, destDir, pairs, by) {
    GeneratedFileWriter.syncFiles(root, destDir, pairs, by);
  }

  static syncPage(root, destDir, by) {
    const pairs = IdeWebviewFiles.copyPairs();
    GeneratedFileWriter.syncFiles(root, destDir, pairs, by);
    IdeWebviewFiles._writeApp(root, destDir, by);
    return pairs.length + 1;
  }

  static copyPairs() {
    return [
      ...IdeWebviewFiles.PAGE_FILES.map((f) => [`${IdeWebviewFiles.PAGE_DIR}/${f}`, f]),
      ...IdeWebviewFiles.SHARED_FILES.map(([from, name]) => [from, `shared/${name}`]),
    ];
  }

  static _writeApp(root, destDir, by) {
    const note = `Bundled from ${WebviewAppBundler.ENTRY} and its imports by ${by}. Do not edit here.`;
    const body = GeneratedFileWriter.stamp(IdeWebviewFiles.APP_FILE, WebviewAppBundler.bundle(root), note);
    GeneratedFileWriter.write(path.join(destDir, IdeWebviewFiles.APP_FILE), body);
  }
}

module.exports = IdeWebviewFiles;
