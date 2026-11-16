const ApiSecurityConfig = require('./ApiSecurityConfig');

class OpenAccessMigration {
  static DONE_KEY = 'core.apiSecurity.openAccessReviewed';
  static NARROWED_MODE = 'lan';

  static run(db, env = process.env) {
    if (!db || db.get(OpenAccessMigration.DONE_KEY, false)) return false;
    db.set(OpenAccessMigration.DONE_KEY, true);
    const stored = db.get(ApiSecurityConfig.STORAGE_KEY, null);
    if (!OpenAccessMigration._isLegacyOpen(stored, env)) return false;
    db.set(ApiSecurityConfig.STORAGE_KEY, { ...stored, networkMode: OpenAccessMigration.NARROWED_MODE });
    return true;
  }

  static _isLegacyOpen(stored, env) {
    if (!stored || env.LUMA_DOCKER) return false;
    const config = ApiSecurityConfig.normalize(stored, env);
    return config.networkMode === 'any' && !config.requireApiKey;
  }
}

module.exports = OpenAccessMigration;
