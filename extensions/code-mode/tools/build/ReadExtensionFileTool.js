const CodeTool = require('../CodeTool');

class ReadExtensionFileTool extends CodeTool {
  constructor(workspace) {
    super();
    this._workspace = workspace;
  }

  get name() {
    return 'read_extension_file';
  }

  get description() {
    return 'Read back a file you have written in the extension being built.';
  }

  get inputSchema() {
    return {
      type: 'object',
      properties: { path: { type: 'string', description: 'Relative file path' } },
      required: ['path'],
    };
  }

  async handle(params) {
    const s = this._workspace.current();
    if (!s) return { success: false, error: 'No files written yet.' };
    try {
      return { success: true, content: this._workspace.code.readFile(s.workspaceId, params && params.path) };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
}

module.exports = ReadExtensionFileTool;
