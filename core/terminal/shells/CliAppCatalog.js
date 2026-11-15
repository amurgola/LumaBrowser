const ExecutableFinder = require('../../shell/harness-connections/ExecutableFinder');

class CliAppCatalog {
  static APPS = Object.freeze([
    Object.freeze({ id: 'claude', label: 'Claude Code', bin: 'claude', command: 'claude' }),
    Object.freeze({ id: 'codex', label: 'Codex CLI', bin: 'codex', command: 'codex' }),
    Object.freeze({ id: 'gemini', label: 'Gemini CLI', bin: 'gemini', command: 'gemini' }),
    Object.freeze({ id: 'opencode', label: 'opencode', bin: 'opencode', command: 'opencode' }),
    Object.freeze({ id: 'copilot', label: 'GitHub Copilot CLI', bin: 'copilot', command: 'copilot' }),
    Object.freeze({ id: 'aider', label: 'Aider', bin: 'aider', command: 'aider' }),
    Object.freeze({ id: 'luma', label: 'Luma agent', bin: 'luma', command: 'luma' }),
  ]);

  static detect({ env = process.env, platform = process.platform, find = ExecutableFinder.find } = {}) {
    return CliAppCatalog.APPS
      .filter((app) => !!find(app.bin, env.PATH || '', env, platform))
      .map((app) => ({ id: `app:${app.id}`, label: app.label, kind: 'app', command: app.command, source: 'app' }));
  }
}

module.exports = CliAppCatalog;
