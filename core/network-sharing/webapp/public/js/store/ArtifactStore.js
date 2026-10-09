import StoreRecords from './StoreRecords.js';

export default class ArtifactStore {
  constructor(repo) {
    this._repo = repo;
  }

  async put(artifact) {
    const rec = { id: StoreRecords.newId('art'), createdAt: StoreRecords.now(), ...artifact };
    await this._repo.run([StoreRecords.ARTIFACTS], 'readwrite', (db) => db.put(StoreRecords.ARTIFACTS, rec));
    return rec;
  }

  get(id) {
    return this._repo.run([StoreRecords.ARTIFACTS], 'readonly', (db) => db.get(StoreRecords.ARTIFACTS, id));
  }

  async list(conversationId) {
    const all = await this._repo.run([StoreRecords.ARTIFACTS], 'readonly',
      (db) => db.getAllByIndex(StoreRecords.ARTIFACTS, 'conversationId', conversationId));
    return all || [];
  }

  async delete(id) {
    await this._repo.run([StoreRecords.ARTIFACTS], 'readwrite', (db) => db.delete(StoreRecords.ARTIFACTS, id));
  }
}
