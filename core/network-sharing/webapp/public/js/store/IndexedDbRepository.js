export default class IndexedDbRepository {
  constructor({ indexedDB, name, version, stores }) {
    this._idb = indexedDB;
    this._name = name;
    this._version = version;
    this._stores = stores;
    this._db = null;
  }

  run(storeNames, mode, fn) {
    return this._open().then((db) => new Promise((resolve, reject) => {
      const tx = db.transaction(storeNames, mode);
      let out;
      Promise.resolve(fn(IndexedDbRepository._ops(tx))).then((r) => { out = r; }).catch(reject);
      tx.oncomplete = () => resolve(out);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    }));
  }

  _open() {
    if (this._db) return this._db;
    this._db = new Promise((resolve, reject) => {
      const req = this._idb.open(this._name, this._version);
      req.onupgradeneeded = () => this._createStores(req.result);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return this._db;
  }

  _createStores(db) {
    for (const [name, def] of Object.entries(this._stores)) {
      if (db.objectStoreNames.contains(name)) continue;
      const store = db.createObjectStore(name, { keyPath: def.keyPath });
      for (const index of def.indexes || []) store.createIndex(index, index);
    }
  }

  static _ops(tx) {
    const store = (name) => tx.objectStore(name);
    const req = IndexedDbRepository._request;
    return {
      get: (name, key) => req(store(name).get(key)),
      getAll: (name) => req(store(name).getAll()),
      put: (name, record) => req(store(name).put(record)),
      delete: (name, key) => req(store(name).delete(key)),
      getAllByIndex: (name, index, key) => req(store(name).index(index).getAll(key)),
      getAllKeysByIndex: (name, index, key) => req(store(name).index(index).getAllKeys(key)),
    };
  }

  static _request(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}
