const path = require('path');
const EsModuleDetector = require('./EsModuleDetector');
const HtmlScriptScanner = require('./HtmlScriptScanner');
const PathReferenceScanner = require('./PathReferenceScanner');
const RequireScanner = require('./RequireScanner');

class SourceClassifier {
  static FIXED_PLAIN = { 'main.js': 'electron-entry', 'jest.config.js': 'dev-only' };
  static NODE_ENTRIES = ['mcp-server.js'];
  static BROWSER_DIR_SEGMENTS = ['ui', 'public'];
  static PRELOAD_NAME = /(^|[-.])preload\.js$/i;
  static WORKER_NAME = /worker\.js$/i;
  static CONTEXT_ROOT_REASONS = new Set(['preload', 'worker', 'path-loaded', 'node-entry']);

  constructor(tree, { privateExtensionDirs = new Set(), manifestBrowserFiles = [] } = {}) {
    this._tree = tree;
    this._privateDirs = privateExtensionDirs;
    this._manifestBrowserFiles = manifestBrowserFiles;
    this._plain = new Map();
  }

  classify() {
    this._markFixedFiles();
    this._markBrowserDirs();
    this._markEsModules();
    this._markHtmlScripts();
    this._markManifestBrowserFiles();
    this._markByName();
    this._markPathLoaded();
    this._markRequireClosures();
    this._markPublicExtensions();
    return this._decisions();
  }

  _markFixedFiles() {
    for (const [rel, reason] of Object.entries(SourceClassifier.FIXED_PLAIN)) this._plainIfPresent(rel, reason);
    for (const rel of SourceClassifier.NODE_ENTRIES) this._plainIfPresent(rel, 'node-entry');
  }

  _markBrowserDirs() {
    for (const rel of this._tree.jsFiles()) {
      const dirs = rel.split('/').slice(0, -1);
      if (dirs.some((d) => SourceClassifier.BROWSER_DIR_SEGMENTS.includes(d))) this._setPlain(rel, 'browser-dir');
    }
  }

  _markEsModules() {
    for (const rel of this._tree.jsFiles()) {
      if (EsModuleDetector.isEsModule(this._tree.read(rel))) this._setPlain(rel, 'es-module');
    }
  }

  _markHtmlScripts() {
    for (const html of this._tree.htmlFiles()) {
      const scripts = HtmlScriptScanner.scripts(this._tree.read(html), this._tree.abs(html), this._tree.root);
      for (const rel of scripts) this._plainIfPresent(rel, 'html-script');
    }
  }

  _markManifestBrowserFiles() {
    for (const rel of this._manifestBrowserFiles) this._plainIfPresent(rel, 'manifest-ui');
  }

  _markByName() {
    for (const rel of this._tree.jsFiles()) {
      const reason = SourceClassifier._reasonForName(path.posix.basename(rel));
      if (reason) this._setPlain(rel, reason);
    }
  }

  static _reasonForName(base) {
    if (base === 'manifest.js') return 'manifest';
    if (base === 'renderer.js') return 'renderer-entry';
    if (SourceClassifier.PRELOAD_NAME.test(base)) return 'preload';
    if (SourceClassifier.WORKER_NAME.test(base)) return 'worker';
    return null;
  }

  _markPathLoaded() {
    for (const rel of this._tree.jsFiles()) {
      for (const ref of PathReferenceScanner.references(this._tree, rel)) this._setPlain(ref.target, ref.kind);
    }
  }

  _markRequireClosures() {
    const roots = [...this._plain].filter(([, d]) => SourceClassifier.CONTEXT_ROOT_REASONS.has(d.reason));
    for (const [root] of roots) {
      for (const rel of RequireScanner.closure(this._tree, [root])) this._setPlain(rel, `required-by:${root}`);
    }
  }

  _markPublicExtensions() {
    for (const rel of this._tree.jsFiles()) {
      const parts = rel.split('/');
      if (parts[0] === 'extensions' && !(parts.length > 2 && this._privateDirs.has(parts[1]))) {
        this._setPlain(rel, 'public-extension');
      }
    }
  }

  _plainIfPresent(rel, reason) {
    if (this._tree.has(rel)) this._setPlain(rel, reason);
  }

  _setPlain(rel, reason) {
    if (!this._plain.has(rel)) this._plain.set(rel, { compile: false, reason });
  }

  _decisions() {
    const out = new Map();
    for (const rel of this._tree.jsFiles()) out.set(rel, this._plain.get(rel) || { compile: true, reason: 'main-process' });
    return out;
  }
}

module.exports = SourceClassifier;
