const fs = require('fs');
const path = require('path');
const EsModuleDetector = require('../bytecode/EsModuleDetector');
const ExtensionManifests = require('../bytecode/ExtensionManifests');
const HtmlScriptScanner = require('../bytecode/HtmlScriptScanner');
const SourceTree = require('../bytecode/SourceTree');

class AddonObfuscator {
  static SKIP_DIRS = ['node_modules', 'lib', 'handlers'];

  static OPTIONS = {
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 0.5,
    deadCodeInjection: false,
    numbersToExpressions: true,
    simplify: true,
    stringArray: true,
    stringArrayThreshold: 0.75,
    stringArrayEncoding: ['base64'],
    identifierNamesGenerator: 'hexadecimal',
    selfDefending: false,
    debugProtection: false,
    splitStrings: false,
  };

  constructor({ obfuscator = require('javascript-obfuscator'), log = console.log } = {}) {
    this._obfuscator = obfuscator;
    this._log = log;
  }

  obfuscateTree(stageDir, manifest) {
    const tree = new SourceTree(stageDir);
    const browser = AddonObfuscator.browserFiles(tree, manifest);
    return AddonObfuscator._eligible(tree).map((rel) => this._obfuscateFile(tree, rel, browser.has(rel)));
  }

  static browserFiles(tree, manifest) {
    const out = new Set(ExtensionManifests.browserScripts(manifest));
    for (const html of tree.htmlFiles()) {
      for (const rel of HtmlScriptScanner.scripts(tree.read(html), tree.abs(html), tree.root)) out.add(rel);
    }
    for (const rel of tree.jsFiles()) if (EsModuleDetector.isEsModule(tree.read(rel))) out.add(rel);
    return out;
  }

  static _eligible(tree) {
    return tree.jsFiles().filter((rel) => {
      if (path.posix.basename(rel) === 'manifest.js') return false;
      return !rel.split('/').slice(0, -1).some((dir) => AddonObfuscator.SKIP_DIRS.includes(dir));
    });
  }

  _obfuscateFile(tree, rel, isBrowser) {
    const target = isBrowser ? 'browser-no-eval' : 'node';
    const code = this._obfuscator.obfuscate(tree.read(rel), { ...AddonObfuscator.OPTIONS, target }).getObfuscatedCode();
    fs.writeFileSync(tree.abs(rel), code);
    this._log(`  [obfuscate:${isBrowser ? 'browser' : 'node'}] ${rel}`);
    return { file: rel, target };
  }
}

module.exports = AddonObfuscator;
