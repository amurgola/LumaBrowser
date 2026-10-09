const RoleplayIds = require('./RoleplayIds');

class DataMigration {
  static VERSION = 1;

  static migrate(data) {
    if (!data || typeof data !== 'object') return false;
    let changed = false;
    for (const c of Array.isArray(data.characters) ? data.characters : []) {
      if (c && DataMigration._migrateCharacter(c)) changed = true;
    }
    if (data.version !== DataMigration.VERSION) {
      data.version = DataMigration.VERSION;
      changed = true;
    }
    return changed;
  }

  static _migrateCharacter(c) {
    const seeded = DataMigration._backfillSeed(c);
    const based = DataMigration._promoteAvatar(c);
    const figured = DataMigration._promoteFullBody(c);
    return seeded || based || figured;
  }

  static _backfillSeed(c) {
    if (Number.isFinite(c.seed)) return false;
    c.seed = RoleplayIds.seed();
    return true;
  }

  static _promoteAvatar(c) {
    if (!(c.avatar && c.avatar.b64) || (c.art && c.art.base && c.art.base.b64)) return false;
    c.art = Object.assign({}, c.art, { base: { b64: c.avatar.b64, mime: c.avatar.mime || 'image/png' } });
    return true;
  }

  static _promoteFullBody(c) {
    if (!(c.art && c.art.fullBody && c.art.fullBody.b64) || (c.figure && c.figure.b64)) return false;
    c.figure = { b64: c.art.fullBody.b64, mime: c.art.fullBody.mime || 'image/png' };
    return true;
  }
}

module.exports = DataMigration;
