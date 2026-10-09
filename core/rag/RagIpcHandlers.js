const { ipcMain } = require('electron');
const IpcEnvelope = require('../shared/ipc/IpcEnvelope');
const RagDocumentImporter = require('./RagDocumentImporter');

class RagIpcHandlers {
  static DEFAULT_SCOPE = 'kb';
  static DEFAULT_K = 5;

  constructor(ragService, { getMainWindow } = {}) {
    this._rag = ragService;
    this._importer = new RagDocumentImporter(ragService, { getMainWindow });
  }

  register() {
    this._handle('core.rag.pickAndIngest', () => this._importer.pickAndIngest());
    this._handle('core.rag.ingest', (_e, args) => this._importer.ingest(args || {}));
    this._handle('core.rag.list', (_e, args = {}) => ({ documents: this._rag.documentsInScope(RagIpcHandlers._scope(args)) }));
    this._handle('core.rag.remove', (_e, args = {}) => this._remove(args));
    this._handle('core.rag.count', (_e, args = {}) => ({ count: this._rag.count(RagIpcHandlers._scope(args)) }));
    this._handle('core.rag.search', (_e, args = {}) => this._search(args));
  }

  _remove(args) {
    if (args.id == null) return { success: false, error: 'id is required.' };
    this._rag.removeDocument(args.id);
    return { success: true };
  }

  async _search(args) {
    return this._rag.search(args.query, { scope: RagIpcHandlers._scope(args), k: args.k || RagIpcHandlers.DEFAULT_K });
  }

  _handle(channel, fn) {
    ipcMain.handle(channel, IpcEnvelope.enveloped(fn));
  }

  static _scope(args) {
    return args.scope || RagIpcHandlers.DEFAULT_SCOPE;
  }
}

module.exports = RagIpcHandlers;
