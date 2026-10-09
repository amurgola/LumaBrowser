const path = require('path');
const WorkspacePaths = require('./WorkspacePaths');

class WorkspaceFileList {
  static collect(fsOps, dir) {
    const files = [];
    if (fsOps.existsSync(dir)) WorkspaceFileList._walk(fsOps, dir, dir, files);
    return files.sort((a, b) => a.path.localeCompare(b.path));
  }

  static _walk(fsOps, rootDir, absDir, files) {
    for (const entry of fsOps.readdirSync(absDir, { withFileTypes: true })) {
      const child = path.join(absDir, entry.name);
      if (entry.isDirectory()) WorkspaceFileList._walk(fsOps, rootDir, child, files);
      else if (entry.isFile()) files.push({ path: WorkspacePaths.relative(rootDir, child), bytes: fsOps.statSync(child).size });
    }
  }
}

module.exports = WorkspaceFileList;
