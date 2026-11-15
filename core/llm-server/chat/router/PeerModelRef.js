const ChatModelRef = require('./ChatModelRef');

class PeerModelRef {
  constructor({ db }) {
    this._db = db;
  }

  is(modelRef) {
    if (ChatModelRef.isLocal(modelRef) || ChatModelRef.isHelper(modelRef) || ChatModelRef.isProfile(modelRef)) return false;
    const parts = ChatModelRef.split(modelRef);
    if (!parts || !parts.providerId) return false;
    try {
      const configs = (this._db && this._db.get('llm.providerConfigs', [])) || [];
      return configs.some((config) => config && config.id === parts.providerId && config.peerManaged === true);
    } catch (_) {
      return false;
    }
  }
}

module.exports = PeerModelRef;
