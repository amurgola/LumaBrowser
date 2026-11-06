const CardText = require('./CardText');

class VaultCallText {
  static _resolve = null;

  static setResolver(resolve) {
    VaultCallText._resolve = typeof resolve === 'function' ? resolve : null;
  }

  static fill(params) {
    let info = null;
    try { info = VaultCallText._resolve ? VaultCallText._resolve(params || {}) : null; } catch (_) { info = null; }
    if (!info) return 'Let the assistant fill a saved login or address from your vault';
    const name = CardText.clip(info.name || 'saved', 40);
    const where = CardText.clip(info.tabHost || info.site || 'this page', 60);
    if (info.kind === 'profile') return `Fill your "${name}" address into ${where}?`;
    return `Use your ${name} login on ${where}? The assistant fills it and never sees the password.`;
  }

  static DESCRIBERS = Object.freeze({
    vault_fill: (p) => VaultCallText.fill(p),
  });
}

module.exports = VaultCallText;
