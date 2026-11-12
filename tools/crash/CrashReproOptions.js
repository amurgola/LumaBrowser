const path = require('path');

class CrashReproOptions {
  static DEFAULT_RUNS = 30;
  static DEFAULT_HOLD_MS = 25000;
  static DEFAULT_PAUSE_MS = 2000;
  static EXIT_GRACE_MS = 30 * 1000;
  static DEFAULT_API_PORT = 3000;

  static USAGE = [
    'usage: node scripts/crash-repro.js [--runs 30] [--hold 25000] [--continue] [--out <dir>]',
    '                                   [--interact] [--pause 2000] [--drive] [--dry-run] [--help]',
    '',
    '  --runs N     launches to attempt (default 30)',
    '  --hold MS    how long after `ready` to keep the app alive (default 25000)',
    '  --continue   keep going after the first reproduction (default: stop)',
    '  --out DIR    where run folders go (default test-data/crash-repro/<time>)',
    '  --interact   drive synthetic user input (mouse, keys, resize) while the background tabs load',
    '               (scripts/crash-repro-interact.ps1, win32 only)',
    '  --pause MS   pause between launches (default 2000; 0 = relaunch immediately)',
    '  --drive      churn tabs through the app\'s REST API (create / activate / switch back / close)',
    '               while the background tabs load; works even when the desktop is locked',
    '  --dry-run    print the plan and the launch command, launch nothing',
    '',
    'Runs against the real user profile unless LUMA_DATA_DIR is set. With the real profile it refuses to',
    'start while another LumaBrowser / electron instance is running (the single-instance lock would make',
    'every launch exit immediately). LUMA_API_PORT selects the port --drive talks to (default 3000).',
  ].join('\n');

  static parse(argv, { root, env = process.env, now = new Date() } = {}) {
    const read = (name, def) => CrashReproOptions._value(argv, name, def);
    return {
      runs: Number(read('runs', CrashReproOptions.DEFAULT_RUNS)),
      holdMs: Number(read('hold', CrashReproOptions.DEFAULT_HOLD_MS)),
      pauseMs: Number(read('pause', CrashReproOptions.DEFAULT_PAUSE_MS)),
      stopOnCrash: !argv.includes('--continue'),
      interact: argv.includes('--interact'),
      drive: argv.includes('--drive'),
      dryRun: argv.includes('--dry-run'),
      help: argv.includes('--help') || argv.includes('-h'),
      outDir: CrashReproOptions._outDir(read('out', null), root, now),
      apiPort: parseInt(env.LUMA_API_PORT, 10) || CrashReproOptions.DEFAULT_API_PORT,
      exitGraceMs: CrashReproOptions.EXIT_GRACE_MS,
    };
  }

  static _value(argv, name, def) {
    const i = argv.indexOf(`--${name}`);
    if (i === -1) return def;
    const v = argv[i + 1];
    return v === undefined || v.startsWith('--') ? true : v;
  }

  static _outDir(out, root, now) {
    if (typeof out === 'string') return path.resolve(out);
    return path.join(root, 'test-data', 'crash-repro', now.toISOString().replace(/[:.]/g, '-'));
  }
}

module.exports = CrashReproOptions;
