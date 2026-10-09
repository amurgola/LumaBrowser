const path = require('path');
const ContainedPath = require('../../shared/fs/ContainedPath');
const ContainerPath = require('../ContainerPath');

class WorkspacePaths {
  static resolve(baseDir, relPath) {
    const container = ContainerPath.parse(baseDir);
    if (container && WorkspacePaths._isPosixAbsolute(relPath)) {
      return ContainedPath.resolveWithin(baseDir, WorkspacePaths._containerRelative(container, relPath));
    }
    return ContainedPath.resolveWithin(baseDir, relPath);
  }

  static resolveDir(baseDir, relDir) {
    if (!relDir || WorkspacePaths.namesRoot(baseDir, relDir)) return baseDir;
    return WorkspacePaths.resolve(baseDir, relDir);
  }

  static namesRoot(baseDir, ref) {
    const container = ContainerPath.parse(baseDir);
    if (!container || !WorkspacePaths._isPosixAbsolute(ref)) return false;
    return path.posix.normalize(`${ref}/`) === path.posix.normalize(`${container.posix}/`);
  }

  static childDir(rootDir, id) {
    const dir = path.resolve(rootDir, id);
    if (!ContainedPath.isImmediateChild(rootDir, dir)) throw new Error(`Invalid workspace id "${id}"`);
    return dir;
  }

  static relative(baseDir, abs) {
    return path.relative(baseDir, abs).split(path.sep).join('/');
  }

  static _containerRelative(container, posixPath) {
    const rel = path.posix.relative(container.posix, path.posix.normalize(posixPath));
    if (!rel || rel.startsWith('..')) {
      throw new Error(`"${posixPath}" is outside the project root ${container.posix}; use run_command for files elsewhere in the container`);
    }
    return rel;
  }

  static _isPosixAbsolute(ref) {
    return typeof ref === 'string' && ref.startsWith('/');
  }
}

module.exports = WorkspacePaths;
