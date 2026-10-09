const fs = require('fs');
const path = require('path');
const AppOwnedDir = require('./AppOwnedDir');
const FileNameSegment = require('./FileNameSegment');
const SpillWriter = require('./spill/SpillWriter');

class ToolResultSpill {
  static SUBDIR = 'tool-results';
  static WORKSPACE_DOTDIR = '.luma';
  static MAX_SPILL_BYTES = 32 * 1024 * 1024;
  static _baseDirOverride = null;

  static createWriter({ conversationId, turnId = null, workspaceRoot = null } = {}) {
    const convSegment = ToolResultSpill._conversationSegment(conversationId || 'untagged');
    const location = workspaceRoot
      ? ToolResultSpill._workspaceLocation(path.resolve(workspaceRoot), convSegment)
      : ToolResultSpill._appOwnedLocation(convSegment);
    return new SpillWriter({ location, turnId, maxBytes: ToolResultSpill.MAX_SPILL_BYTES });
  }

  static deleteFor(conversationId, { workspaceRoot = null } = {}) {
    const convSegment = ToolResultSpill._conversationSegment(conversationId || '');
    if (convSegment === '_') return;
    const base = ToolResultSpill.appOwnedBase();
    const targets = [];
    if (base) targets.push(path.join(base, convSegment));
    if (workspaceRoot) targets.push(ToolResultSpill._workspaceDir(path.resolve(workspaceRoot), convSegment));
    targets.forEach((target) => ToolResultSpill._removeTree(target));
  }

  static wipeAll() {
    const base = ToolResultSpill.appOwnedBase();
    if (base) ToolResultSpill._removeTree(base);
  }

  static appOwnedBase() {
    return ToolResultSpill._baseDirOverride || AppOwnedDir.resolve(ToolResultSpill.SUBDIR);
  }

  static setBaseDir(dir) {
    ToolResultSpill._baseDirOverride = dir ? path.join(dir, ToolResultSpill.SUBDIR) : null;
  }

  static _workspaceLocation(root, convSegment) {
    return {
      dir: ToolResultSpill._workspaceDir(root, convSegment),
      displayBase: `${ToolResultSpill.WORKSPACE_DOTDIR}/${ToolResultSpill.SUBDIR}/${convSegment}`,
      readable: true,
      gitRoot: root,
      excludePattern: `${ToolResultSpill.WORKSPACE_DOTDIR}/`,
    };
  }

  static _appOwnedLocation(convSegment) {
    const base = ToolResultSpill.appOwnedBase();
    const dir = base ? path.join(base, convSegment) : null;
    return { dir, displayBase: dir, readable: false, gitRoot: null, excludePattern: null };
  }

  static _workspaceDir(root, convSegment) {
    return path.join(root, ToolResultSpill.WORKSPACE_DOTDIR, ToolResultSpill.SUBDIR, convSegment);
  }

  static _conversationSegment(conversationId) {
    return FileNameSegment.from(conversationId) || '_';
  }

  static _removeTree(target) {
    try {
      fs.rmSync(target, { recursive: true, force: true });
    } catch (_) {}
  }
}

module.exports = ToolResultSpill;
