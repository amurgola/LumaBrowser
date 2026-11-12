const fs = require('fs');
const os = require('os');
const path = require('path');

class CardSettingsCli {
  static USAGE = [
    'Usage: npm run models:card-settings -- --repo <owner/name> --model <file or name> [options]',
    '',
    '  --repo <owner/name>   the Hugging Face repo the model came from',
    '  --model <file|name>   the model file (its name without .gguf is the model\'s name in the app)',
    '  --db <path>           the app\'s settings database (default: the installed app\'s)',
    '  --dry-run             show what the repo recommends and what would change; write nothing',
    '  --help',
  ].join('\n');
  static STORAGE_KEY = 'core.llmServer.modelOverrides';

  constructor(repoRoot, deps = {}) {
    this._root = repoRoot;
    this._deps = deps;
    this._log = deps.log || ((line) => process.stdout.write(line + '\n'));
  }

  static parse(argv) {
    const o = { repo: '', model: '', db: '', dryRun: false, help: false };
    const list = Array.isArray(argv) ? argv : [];
    for (let i = 0; i < list.length; i += 1) {
      const a = list[i];
      const next = () => { i += 1; return list[i]; };
      if (a === '--help' || a === '-h') o.help = true;
      else if (a === '--dry-run') o.dryRun = true;
      else if (a === '--repo') o.repo = String(next() || '');
      else if (a === '--model') o.model = String(next() || '');
      else if (a === '--db') o.db = String(next() || '');
      else throw new Error('unknown option ' + a + '\n' + CardSettingsCli.USAGE);
    }
    return o;
  }

  static defaultDb(env = process.env, platform = process.platform) {
    if (platform === 'win32') return path.join(env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), 'lumabrowser', 'settings.db');
    if (platform === 'darwin') return path.join(os.homedir(), 'Library', 'Application Support', 'lumabrowser', 'settings.db');
    return path.join(env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config'), 'lumabrowser', 'settings.db');
  }

  static openDb(file) {
    const Database = require('better-sqlite3');
    const db = new Database(file, { fileMustExist: true });
    return {
      get(key, fallback) {
        const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
        if (!row) return fallback;
        try { return JSON.parse(row.value); } catch (_) { return row.value; }
      },
      set(key, value) {
        const text = typeof value === 'string' ? value : JSON.stringify(value);
        const done = db.prepare('UPDATE settings SET value = ? WHERE key = ?').run(text, key);
        if (!done.changes) db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run(key, text);
      },
      close() { db.close(); },
    };
  }

  async execute(argv) {
    const o = CardSettingsCli.parse(argv);
    if (o.help || !o.repo || !o.model) { this._log(CardSettingsCli.USAGE); return null; }
    const R = (rel) => require(path.join(this._root, rel));
    const ModelSettings = R('core/llm-server/service/ModelSettings');
    const ModelOverrideStore = R('core/llm-server/service/ModelOverrideStore');
    const find = this._deps.find || ((repo) => R('core/llm-server/models/ModelCardSettings').find(repo));
    const modelRef = ModelSettings.localRef(o.model);
    const hit = await find(o.repo);
    if (!hit) {
      this._log('Nothing recommended in the model card or repo of ' + o.repo + '. The app\'s defaults stay as they are.');
      return { found: false, modelRef };
    }
    this._log('Recommended by ' + hit.text + ': ' + JSON.stringify(hit.settings));
    const file = o.db || CardSettingsCli.defaultDb();
    if (!this._deps.openDb && !fs.existsSync(file)) throw new Error('settings database not found: ' + file);
    const db = (this._deps.openDb || CardSettingsCli.openDb)(file);
    try {
      const overrides = new ModelOverrideStore(db);
      const before = overrides.get(modelRef);
      const settings = new ModelSettings({ overrides, profiles: { get: () => null }, launchFlags: null, getDefaults: () => ({}), lastModelRef: null });
      if (o.dryRun) {
        const missing = Object.fromEntries(Object.entries(hit.settings).filter(([k]) => before[k] === undefined));
        this._log('Model ' + modelRef + ' has now: ' + JSON.stringify(before));
        this._log('Would fill in: ' + JSON.stringify(missing) + ' (dry run, nothing written)');
        return { found: true, modelRef, dryRun: true, wouldApply: missing, before };
      }
      const { applied, kept } = settings.applySuggested(modelRef, hit.settings, hit.text);
      const after = overrides.get(modelRef);
      this._log('Model ' + modelRef + ' had: ' + JSON.stringify(before));
      this._log(Object.keys(applied).length ? 'Filled in: ' + JSON.stringify(applied) : 'Nothing to fill in.');
      if (Object.keys(kept).length) this._log('Kept as already set: ' + JSON.stringify(kept));
      this._log('Model ' + modelRef + ' has now: ' + JSON.stringify(after));
      return { found: true, modelRef, applied, kept, before, after, db: file };
    } finally {
      db.close();
    }
  }
}

module.exports = CardSettingsCli;
