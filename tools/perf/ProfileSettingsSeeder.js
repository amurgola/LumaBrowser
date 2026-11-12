const path = require('path');
const SettingsDatabase = require('../../core/database/SettingsDatabase');

class ProfileSettingsSeeder {
  static DB_FILE = 'settings.db';

  static seed(dataDir, env) {
    const values = ProfileSettingsSeeder.values(env);
    const db = new SettingsDatabase(path.join(dataDir, ProfileSettingsSeeder.DB_FILE));
    try {
      for (const [key, value] of Object.entries(values)) db.set(key, value);
    } finally {
      db.close();
    }
    return values;
  }

  static values(env) {
    return {
      'core.setupComplete': env.LUMA_PERF_FIRST_RUN !== '1',
      'core.app.autoCheckUpdates': false,
      'core.adblocker.enabled': env.LUMA_PERF_NO_ADBLOCK !== '1',
    };
  }
}

module.exports = ProfileSettingsSeeder;
