const WorkspacePaths = require('./WorkspacePaths');

class CommandCwd {
  static ROOT_SPELLINGS = new Set(['.', './']);

  static resolve(fsOps, rootDir, requested) {
    const rel = requested && String(requested).trim();
    if (CommandCwd._isRoot(rootDir, rel)) return { cwd: rootDir };
    let cwd;
    try {
      cwd = WorkspacePaths.resolve(rootDir, rel);
    } catch (err) {
      return { refusal: CommandCwd._refused(`cwd refused: ${err.message}`) };
    }
    if (!CommandCwd._isDirectory(fsOps, cwd)) return { refusal: CommandCwd._refused(`cwd is not a directory in the project: ${rel}`) };
    return { cwd };
  }

  static _isRoot(rootDir, rel) {
    return !rel || CommandCwd.ROOT_SPELLINGS.has(rel) || WorkspacePaths.namesRoot(rootDir, rel);
  }

  static _isDirectory(fsOps, dir) {
    try {
      return fsOps.statSync(dir).isDirectory();
    } catch (_) {
      return false;
    }
  }

  static _refused(error) {
    return { error, exitCode: null, output: '', timedOut: false, aborted: false, spillPath: null, durationMs: 0, shell: '', syntax: '' };
  }
}

module.exports = CommandCwd;
