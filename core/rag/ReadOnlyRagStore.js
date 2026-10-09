const fs = require('fs');
const PrebuiltRagMeta = require('./PrebuiltRagMeta');
const RagStore = require('./RagStore');

class ReadOnlyRagStore extends RagStore {
  constructor({ dbPath, db } = {}) {
    super({ dbPath, db, readOnly: true });
    try {
      this._meta = PrebuiltRagMeta.read(this.db);
    } catch (err) {
      this.close();
      throw err;
    }
  }

  static openIfPresent(dbPath) {
    if (!dbPath || !fs.existsSync(dbPath)) return null;
    return new ReadOnlyRagStore({ dbPath });
  }

  get scope() {
    return this._meta.scope || RagStore.DEFAULT_SCOPE;
  }

  meta() {
    return { ...this._meta };
  }

  documentsInScope(scope = this.scope) {
    return super.documentsInScope(scope);
  }

  count(scope = this.scope) {
    return super.count(scope);
  }

  addDocument() {
    throw ReadOnlyRagStore._readOnly('addDocument');
  }

  addChunks() {
    throw ReadOnlyRagStore._readOnly('addChunks');
  }

  removeDocument() {
    throw ReadOnlyRagStore._readOnly('removeDocument');
  }

  static _readOnly(method) {
    return new Error(`ReadOnlyRagStore.${method}: this knowledge base is read-only.`);
  }
}

module.exports = ReadOnlyRagStore;
