const ContextSurface = require('./ContextSurface');
const CodeWorkspace = require('../CodeWorkspace');

class CodeSurface extends ContextSurface {
  static ENFORCE_OBSERVATION_KEY = 'core.shell.code.enforceObservation';
  static NO_ROOT_MESSAGE = 'code workspace unavailable - no writable extensions directory';

  constructor({ userExtensionsDir, coreServices = {}, manifests, install, capabilities }) {
    super();
    this._rootDir = userExtensionsDir || null;
    this._coreServices = coreServices;
    this._manifests = manifests;
    this._install = install;
    this._capabilities = capabilities;
    this._workspace = null;
  }

  get key() {
    return 'code';
  }

  forExtension(extensionId) {
    const ws = () => this._ensureWorkspace();
    return {
      createWorkspace: (opts = {}) => this._createWorkspace(opts),
      openProject: (opts = {}) => ws().openProject(opts),
      writeFile: (workspaceId, relPath, content) => ws().writeFile(workspaceId, relPath, content),
      writeBytes: (workspaceId, relPath, bytes, opts) => ws().writeBytes(workspaceId, relPath, bytes, opts),
      readFile: (workspaceId, relPath) => ws().readFile(workspaceId, relPath),
      readLines: (workspaceId, relPath, range) => ws().readLines(workspaceId, relPath, range),
      listFiles: (workspaceId) => ws().listFiles(workspaceId),
      editFile: (workspaceId, relPath, edits) => ws().editFile(workspaceId, relPath, edits),
      grep: (workspaceId, opts) => ws().grep(workspaceId, opts),
      find: (workspaceId, opts) => ws().find(workspaceId, opts),
      listDir: (workspaceId, relDir) => ws().listDir(workspaceId, relDir),
      projectMap: (workspaceId) => ws().projectMap(workspaceId),
      runCommand: (workspaceId, spec) => ws().runCommand(workspaceId, spec),
      commandShell: (kind) => ws().commandShell(kind),
      contextFiles: (workspaceId) => ws().contextFiles(workspaceId),
      validate: (relPath, content) => ws().validate(relPath, content),
      manifestSanity: (workspaceId) => ws().manifestSanity(workspaceId),
      discardWorkspace: (workspaceId) => ws().discardWorkspace(workspaceId),
      capabilities: () => this._capabilities(extensionId),
      installAndActivate: (workspaceId) => this._installAndActivate(workspaceId),
    };
  }

  _ensureWorkspace() {
    if (this._workspace) return this._workspace;
    if (!this._rootDir) throw new Error(CodeSurface.NO_ROOT_MESSAGE);
    this._workspace = new CodeWorkspace({ rootDir: this._rootDir, enforceObservation: this._enforceObservation() });
    return this._workspace;
  }

  _enforceObservation() {
    const db = this._coreServices.database;
    return db ? db.get(CodeSurface.ENFORCE_OBSERVATION_KEY, true) !== false : true;
  }

  _createWorkspace(opts) {
    const workspace = this._ensureWorkspace();
    const id = CodeWorkspace.sanitizeId(opts.name);
    const existing = this._manifests.get(id);
    if (existing && existing._userInstalled === false) {
      throw new Error(`"${id}" is a built-in extension id and cannot be used`);
    }
    return workspace.createWorkspace(opts);
  }

  async _installAndActivate(workspaceId) {
    let workspace;
    let record;
    try {
      workspace = this._ensureWorkspace();
      record = workspace.getWorkspace(workspaceId);
    } catch (e) {
      return { ok: false, error: e.message };
    }
    const sanity = workspace.manifestSanity(workspaceId);
    if (!sanity.ok) return { ok: false, error: 'manifest check failed', errors: sanity.errors };
    const result = await this._install(record.dir);
    if (!result.success) return { ok: false, error: result.error };
    return { ok: true, extensionId: result.id, name: result.name };
  }
}

module.exports = CodeSurface;
