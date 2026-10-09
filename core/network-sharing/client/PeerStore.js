const SettingsValueStore = require('../../database/SettingsValueStore');

class PeerStore extends SettingsValueStore {
  static STORAGE_KEY = 'core.sharing.peers';

  constructor(db) {
    super(db, PeerStore.STORAGE_KEY);
  }

  all() {
    return this._read();
  }

  find(id) {
    return this._read().find((peer) => peer.id === id) || null;
  }

  writeAll(peers) {
    this._write(peers);
  }

  patch(id, patch) {
    const peers = this._read();
    const index = peers.findIndex((peer) => peer.id === id);
    if (index < 0) return;
    peers[index] = { ...peers[index], ...patch };
    this._write(peers);
  }

  upsert(peer) {
    const peers = this._read();
    const index = peers.findIndex((existing) => existing.id === peer.id);
    if (index >= 0) peers[index] = { ...peers[index], ...peer };
    else peers.push(peer);
    this._write(peers);
  }

  remove(id) {
    this._write(this._read().filter((peer) => peer.id !== id));
  }

  resetBackoff() {
    const peers = this._read();
    let changed = false;
    for (const peer of peers) {
      if (!peer._failCount && !peer._nextAttemptAt) continue;
      delete peer._failCount;
      delete peer._nextAttemptAt;
      changed = true;
    }
    if (changed) this._write(peers);
  }

  _emptyValue() {
    return [];
  }

  _hasValidShape(value) {
    return Array.isArray(value);
  }
}

module.exports = PeerStore;
