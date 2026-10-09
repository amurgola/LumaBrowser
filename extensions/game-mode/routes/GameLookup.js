const fs = require('fs');
const path = require('path');

class GameLookup {
  static find(api, rawConvId, entry = '') {
    let convId;
    let root;
    try {
      convId = api.sanitizeConvId(rawConvId);
      root = api.gameDirFor(convId);
    } catch (_) { return null; }
    return fs.existsSync(entry ? path.join(root, entry) : root) ? { convId, root } : null;
  }
}

module.exports = GameLookup;
