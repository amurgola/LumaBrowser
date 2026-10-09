const CodeTool = require('../CodeTool');

class ListExtensionFilesTool extends CodeTool {
  constructor(workspace) {
    super();
    this._workspace = workspace;
  }

  get name() {
    return 'list_extension_files';
  }

  get description() {
    return 'List the files written so far in the extension being built.';
  }

  async handle() {
    const s = this._workspace.current();
    if (!s) return { success: true, files: [] };
    return { success: true, files: this._workspace.code.listFiles(s.workspaceId) };
  }
}

module.exports = ListExtensionFilesTool;
