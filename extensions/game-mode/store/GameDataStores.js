const GameDataStore = require('./GameDataStore');

class GameDataStores {
  static _stores = new Map();

  static forDir(gameDir) {
    let store = GameDataStores._stores.get(gameDir);
    if (!store) {
      store = new GameDataStore(gameDir);
      GameDataStores._stores.set(gameDir, store);
    }
    return store;
  }

  static drop(gameDir) {
    GameDataStores._stores.delete(gameDir);
  }
}

module.exports = GameDataStores;
