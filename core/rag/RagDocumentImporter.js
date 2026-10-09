const DocumentParser = require('./DocumentParser');

class RagDocumentImporter {
  static DEFAULT_SCOPE = 'kb';
  static DIALOG_OPTIONS = {
    title: 'Add documents to the knowledge base',
    properties: ['openFile', 'multiSelections'],
    filters: [{ name: 'Documents', extensions: DocumentParser.supportedExtensions().map((ext) => ext.slice(1)) }],
  };

  constructor(ragService, { getMainWindow, showOpenDialog } = {}) {
    this._rag = ragService;
    this._getMainWindow = typeof getMainWindow === 'function' ? getMainWindow : () => null;
    this._showOpenDialog = showOpenDialog || ((win, options) => require('electron').dialog.showOpenDialog(win, options));
  }

  async pickAndIngest() {
    const picked = await this._showOpenDialog(this._getMainWindow() || null, RagDocumentImporter.DIALOG_OPTIONS);
    if (picked.canceled || !picked.filePaths.length) return { success: true, results: [], canceled: true };
    return { success: true, results: await this._ingestAll(picked.filePaths, RagDocumentImporter.DEFAULT_SCOPE) };
  }

  async ingest(args = {}) {
    const paths = RagDocumentImporter._pathsFrom(args);
    if (!paths.length) return { success: false, error: 'No path(s) provided.' };
    return { success: true, results: await this._ingestAll(paths, args.scope || RagDocumentImporter.DEFAULT_SCOPE) };
  }

  async _ingestAll(paths, scope) {
    const results = [];
    for (const filePath of paths) {
      results.push({ path: filePath, ...(await this._rag.ingestFile(filePath, { scope })) });
    }
    return results;
  }

  static _pathsFrom(args) {
    if (Array.isArray(args.paths)) return args.paths;
    return args.path ? [args.path] : [];
  }
}

module.exports = RagDocumentImporter;
