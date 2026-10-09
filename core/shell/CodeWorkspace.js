const fs = require('fs');
const path = require('path');
const Slug = require('../shared/text/Slug');
const CodeSearch = require('./CodeSearch');
const CommandRunner = require('./CommandRunner');
const ContainerFs = require('./ContainerFs');
const ProjectContextFiles = require('./ProjectContextFiles');
const ProjectMap = require('./ProjectMap');
const CommandCwd = require('./code-workspace/CommandCwd');
const ManifestSanity = require('./code-workspace/ManifestSanity');
const ReadGuard = require('./code-workspace/ReadGuard');
const WorkspaceFileList = require('./code-workspace/WorkspaceFileList');
const WorkspaceMutations = require('./code-workspace/WorkspaceMutations');
const WorkspacePaths = require('./code-workspace/WorkspacePaths');
const WorkspaceRegistry = require('./code-workspace/WorkspaceRegistry');

class CodeWorkspace {
  static sanitizeId(name) {
    return Slug.from(name);
  }

  constructor({ rootDir, fsOps, enforceObservation = true, commandRunner } = {}) {
    if (!rootDir) throw new Error('CodeWorkspace requires a rootDir');
    this._rootDir = path.resolve(rootDir);
    this._fs = fsOps || ContainerFs.routed(fs);
    this._commands = commandRunner || new CommandRunner();
    this._registry = new WorkspaceRegistry();
    this._guard = new ReadGuard({ fsOps: this._fs, enforce: enforceObservation });
    this._mutations = new WorkspaceMutations({ fsOps: this._fs, guard: this._guard });
    this._search = new CodeSearch({ fsOps: this._fs });
    this._map = new ProjectMap({ search: this._search });
  }

  openProject({ path: projectPath } = {}) {
    const dir = this._existingProjectDir(projectPath);
    const id = path.basename(dir) || 'project';
    const workspaceId = this._registry.add('proj', { id, dir, kind: WorkspaceRegistry.PROJECT_KIND, name: id });
    return { workspaceId, id, dir };
  }

  createWorkspace({ kind = 'extension', name, overwrite = false } = {}) {
    const id = CodeWorkspace.sanitizeId(name);
    if (!id) throw new Error(`Cannot derive a valid id from name "${name}"`);
    const dir = WorkspacePaths.childDir(this._rootDir, id);
    this._prepareBuildDir(dir, id, overwrite);
    const workspaceId = this._registry.add('ws', { id, dir, kind, name: String(name) });
    return { workspaceId, id, dir };
  }

  getWorkspace(workspaceId) {
    return this._registry.get(workspaceId);
  }

  validate(relPath, content) {
    return WorkspaceMutations.validate(relPath, content);
  }

  writeFile(workspaceId, relPath, content) {
    return this._mutations.writeText(this._dirOf(workspaceId), relPath, content);
  }

  writeBytes(workspaceId, relPath, bytes, options) {
    return this._mutations.writeBytes(this._dirOf(workspaceId), relPath, bytes, options);
  }

  editFile(workspaceId, relPath, edits) {
    return this._mutations.edit(this._dirOf(workspaceId), relPath, edits);
  }

  readFile(workspaceId, relPath) {
    const target = WorkspacePaths.resolve(this._dirOf(workspaceId), relPath);
    const text = this._fs.readFileSync(target, 'utf8');
    this._guard.observe(target, text);
    return text;
  }

  readLines(workspaceId, relPath, { offset = 1, limit } = {}) {
    const target = WorkspacePaths.resolve(this._dirOf(workspaceId), relPath);
    const raw = this._fs.readFileSync(target, 'utf8');
    this._guard.observe(target, raw);
    return CodeWorkspace._lineRange(raw.split('\n'), offset, limit);
  }

  grep(workspaceId, options) {
    return this._search.grep(this._dirOf(workspaceId), options);
  }

  find(workspaceId, options) {
    return this._search.find(this._dirOf(workspaceId), options);
  }

  listDir(workspaceId, relDir = '') {
    return this._search.listDir(WorkspacePaths.resolveDir(this._dirOf(workspaceId), relDir));
  }

  projectMap(workspaceId) {
    return this._map.build(this._dirOf(workspaceId));
  }

  listFiles(workspaceId) {
    return WorkspaceFileList.collect(this._fs, this._dirOf(workspaceId));
  }

  manifestSanity(workspaceId) {
    const record = this.getWorkspace(workspaceId);
    return ManifestSanity.check(record.dir, record.id);
  }

  discardWorkspace(workspaceId) {
    const record = this._registry.find(workspaceId);
    if (!record) return { ok: false };
    const isProject = WorkspaceRegistry.isProject(record);
    if (!isProject) this._removeDir(record.dir);
    this._guard.forgetUnder(record.dir);
    this._registry.remove(workspaceId);
    return isProject ? { ok: true, forgotten: true } : { ok: true };
  }

  async runCommand(workspaceId, spec = {}) {
    const dir = this._dirOf(workspaceId);
    const resolved = CommandCwd.resolve(this._fs, dir, spec.cwd);
    if (resolved.refusal) return resolved.refusal;
    const result = await this._commands.run({ ...spec, cwd: resolved.cwd });
    result.cwd = WorkspacePaths.relative(dir, resolved.cwd) || '.';
    return result;
  }

  commandShell(kind) {
    return this._commands.resolveShell(kind || 'auto');
  }

  contextFiles(workspaceId) {
    return ProjectContextFiles.collect(this._dirOf(workspaceId), { fsOps: this._fs });
  }

  _dirOf(workspaceId) {
    return this.getWorkspace(workspaceId).dir;
  }

  _existingProjectDir(projectPath) {
    if (!projectPath || typeof projectPath !== 'string') throw new Error('openProject requires a path');
    const dir = path.resolve(projectPath);
    let stat;
    try {
      stat = this._fs.statSync(dir);
    } catch (_) {
      throw new Error(`Project path does not exist: ${dir}`);
    }
    if (!stat.isDirectory()) throw new Error(`Project path is not a directory: ${dir}`);
    return dir;
  }

  _prepareBuildDir(dir, id, overwrite) {
    if (this._fs.existsSync(dir)) {
      if (!overwrite) throw new Error(`A workspace/extension "${id}" already exists`);
      this._fs.rmSync(dir, { recursive: true, force: true });
      this._guard.forgetUnder(dir);
    }
    this._fs.mkdirSync(dir, { recursive: true });
  }

  _removeDir(dir) {
    try {
      this._fs.rmSync(dir, { recursive: true, force: true });
    } catch (_) {}
  }

  static _lineRange(lines, offset, limit) {
    const start = Math.max(0, (Number(offset) || 1) - 1);
    const slice = limit ? lines.slice(start, start + Number(limit)) : lines.slice(start);
    return { content: slice.join('\n'), startLine: start + 1, endLine: start + slice.length, totalLines: lines.length };
  }
}

module.exports = CodeWorkspace;
