const CodeTool = require('../CodeTool');

class DiscardBuildTool extends CodeTool {
  constructor(workspace) {
    super();
    this._workspace = workspace;
  }

  get name() {
    return 'discard_build';
  }

  get description() {
    return 'Abandon the current build and delete its files from disk. Use this to start over from '
      + 'scratch, or after repeated failures you cannot fix. Does nothing once the extension is installed '
      + '(a live extension is removed by the user from the Extensions area, not here).';
  }

  async handle(_params, opts = {}) {
    const s = this._workspace.current();
    if (!s) return { success: true, message: 'There is no build to discard.' };
    if (s.status === 'installed') {
      return { success: false, error: 'This build is already installed and live; it can only be removed from the Extensions area.' };
    }
    try { this._workspace.code.discardWorkspace(s.workspaceId); } catch (_) {}
    this._workspace.forget();
    this._workspace.emitState(opts.emit, null);
    return { success: true, message: 'Discarded the build and removed its files. You can start a new one with write_extension_file.' };
  }
}

module.exports = DiscardBuildTool;
