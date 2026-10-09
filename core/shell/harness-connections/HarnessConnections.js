const fs = require('fs');
const os = require('os');
const path = require('path');
const AppPaths = require('../../shared/AppPaths');
const ConfigBackups = require('./ConfigBackups');
const ConfigFile = require('./ConfigFile');
const ConnectionLock = require('./ConnectionLock');
const ConnectionManifest = require('./ConnectionManifest');
const ConnectionStager = require('./ConnectionStager');
const ExecutableFinder = require('./ExecutableFinder');
const FileTransaction = require('./FileTransaction');
const ClaudeCodeConnector = require('./connectors/ClaudeCodeConnector');
const ClineConnector = require('./connectors/ClineConnector');
const CodexConnector = require('./connectors/CodexConnector');
const OpenCodeConnector = require('./connectors/OpenCodeConnector');

class HarnessConnections {
  static CONNECTORS = [new ClaudeCodeConnector(), new CodexConnector(), new OpenCodeConnector(), new ClineConnector()];
  static MANIFEST_FILE = 'harness-connections.json';
  static BACKUP_DIR = 'harness-backups';
  static ACTIONS = ['connect', 'disconnect'];

  static SKILL_MD = `---
name: luma
description: Operate LumaBrowser from the terminal. Use for browser automation, the local model API, Network Sharing, MCP tools, or any LumaBrowser question.
---

# LumaBrowser

LumaBrowser runs local models and drives a real browser. Its CLI is \`luma\`.

Read \`luma docs\` for the topic list, then \`luma docs <topic>\` for the exact
reference: \`local-api\` (OpenAI and Anthropic endpoints on this computer),
\`api\` (REST browser automation), \`tools\` (MCP tool groups), and
\`remote-access\` (reaching a LumaBrowser on another machine). The docs print
without the app running. \`luma "<prompt>"\` runs a LumaBrowser agent over the
current folder; \`luma --agents\` lists agents.
`;

  constructor({ getEndpoints, getModel = () => null, paths = null, executableDirs = null, now = () => new Date() } = {}) {
    if (typeof getEndpoints !== 'function') throw new Error('HarnessConnections: getEndpoints is required');
    this._getEndpoints = getEndpoints;
    this._paths = paths || HarnessConnections.paths({ baseDir: HarnessConnections._appBaseDir() });
    this._executableDirs = executableDirs;
    this._now = now;
    this._manifest = new ConnectionManifest(this._paths.manifest);
    this._lock = new ConnectionLock(`${this._paths.manifest}.lock`);
    this._backups = new ConfigBackups(this._paths.backups);
    this._stager = new ConnectionStager({
      paths: this._paths, manifest: this._manifest, backups: this._backups, getEndpoints, getModel, now,
    });
  }

  static paths({ home = os.homedir(), env = process.env, baseDir } = {}) {
    const claudeDir = env.CLAUDE_CONFIG_DIR || path.join(home, '.claude');
    const clineProviderSettings = env.CLINE_PROVIDER_SETTINGS_PATH || path.join(env.CLINE_DATA_DIR || path.join(home, '.cline', 'data'), 'settings', 'providers.json');
    const appDir = baseDir || home;
    return {
      manifest: path.join(appDir, HarnessConnections.MANIFEST_FILE),
      backups: path.join(appDir, HarnessConnections.BACKUP_DIR),
      claudeSettings: path.join(claudeDir, 'settings.json'),
      claudeUser: path.join(home, '.claude.json'),
      codexConfig: path.join(env.CODEX_HOME || path.join(home, '.codex'), 'config.toml'),
      opencode: HarnessConnections._openCodeConfig(home, env),
      clineProviderSettings,
      clineModels: path.join(path.dirname(clineProviderSettings), 'models.json'),
      clineMcp: path.join(path.dirname(clineProviderSettings), 'cline_mcp_settings.json'),
      skills: [
        path.join(claudeDir, 'skills', 'luma', 'SKILL.md'),
        path.join(home, '.agents', 'skills', 'luma', 'SKILL.md'),
      ],
    };
  }

  connectors() {
    return HarnessConnections.CONNECTORS;
  }

  list() {
    const endpoints = this._getEndpoints();
    return HarnessConnections.CONNECTORS.map((c) => this._row(c, endpoints));
  }

  preview(id, action = 'connect') {
    const c = HarnessConnections._connector(id);
    if (!HarnessConnections.ACTIONS.includes(action)) throw new Error(`Unknown action: ${action}`);
    const staged = action === 'connect' ? this._stager.stageConnect(c) : this._stager.stageDisconnect(c);
    return { harness: id, action, files: staged.workingSet.changes(), kept: staged.kept || [] };
  }

  connect(id) {
    const c = HarnessConnections._connector(id);
    return this._lock.hold(() => {
      const staged = this._stager.stageConnect(c);
      const changes = staged.workingSet.changes();
      const files = this._backups.record(id, changes, staged.previousFiles);
      FileTransaction.run((tx) => {
        staged.workingSet.commit(tx);
        this._manifest.save(this._entry(id, staged, files), tx);
      });
      return { success: true, harness: id, files: c.configFiles(this._paths), model: staged.model, changed: changes.map((ch) => ch.file) };
    });
  }

  disconnect(id) {
    const c = HarnessConnections._connector(id);
    return this._lock.hold(() => {
      const staged = this._stager.stageDisconnect(c);
      FileTransaction.run((tx) => {
        staged.workingSet.commit(tx);
        this._manifest.drop(id, tx);
      });
      return { success: true, harness: id, kept: staged.kept, restored: staged.restored };
    });
  }

  writeSkills() {
    for (const file of this._paths.skills) ConfigFile.writeAtomic(file, HarnessConnections.SKILL_MD);
    return { success: true, files: [...this._paths.skills] };
  }

  skillStatus() {
    return this._paths.skills.map((file) => ({ file, installed: ConfigFile.readTextOr(file, '') === HarnessConnections.SKILL_MD }));
  }

  _row(c, endpoints) {
    const entry = this._manifest.entry(c.id);
    const executable = ExecutableFinder.find(c.executable, this._executableDirs == null ? undefined : this._executableDirs);
    const files = c.configFiles(this._paths);
    const status = this._inspect(c, endpoints);
    return {
      id: c.id,
      name: c.name,
      executable,
      installed: !!executable || files.some((f) => fs.existsSync(f)),
      configFiles: files,
      state: status.state,
      reason: status.reason || null,
      connectedAt: entry ? entry.updatedAt : null,
      model: entry ? entry.model || null : null,
      needsRepair: !!entry && status.state !== 'connected',
      drift: entry ? this._drift(c, entry) : [],
    };
  }

  _inspect(c, endpoints) {
    try {
      return c.inspect({ paths: this._paths, endpoints });
    } catch (err) {
      return { state: 'unavailable', reason: String((err && err.message) || err) };
    }
  }

  _drift(c, entry) {
    try {
      return this._stager.drift(c, entry);
    } catch (_) {
      return [];
    }
  }

  _entry(id, staged, files) {
    return {
      harness: id,
      ledger: staged.ledger,
      files,
      endpoints: staged.endpoints,
      model: staged.model,
      updatedAt: this._now().toISOString(),
    };
  }

  static _connector(id) {
    const c = HarnessConnections.CONNECTORS.find((x) => x.id === id);
    if (!c) throw new Error(`Unknown harness: ${id}`);
    return c;
  }

  static _openCodeConfig(home, env) {
    const dir = path.join(env.XDG_CONFIG_HOME || path.join(home, '.config'), 'opencode');
    const existing = ['config.json', 'opencode.json', 'opencode.jsonc'].map((f) => path.join(dir, f)).filter((f) => fs.existsSync(f));
    return env.OPENCODE_CONFIG || existing[existing.length - 1] || path.join(dir, 'opencode.json');
  }

  static _appBaseDir() {
    try { return AppPaths.appBaseDir(); } catch (_) { return path.join(os.homedir(), '.lumabrowser'); }
  }
}

module.exports = HarnessConnections;
