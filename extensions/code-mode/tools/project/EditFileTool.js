const CodeTool = require('../CodeTool');
const SearchText = require('./SearchText');

class EditFileTool extends CodeTool {
  constructor({ workspace }) {
    super();
    this._workspace = workspace;
  }

  get name() {
    return 'edit_file';
  }

  get description() {
    return 'Make targeted edits to an existing project file. Provide edits as an array of '
      + '{oldText, newText}; each oldText must appear exactly once in the file (add surrounding context to '
      + 'make it unique). You must read the file first: an edit against a file you have not read, or one '
      + 'that changed since you read it, is refused.';
  }

  get inputSchema() {
    return {
      type: 'object',
      properties: {
        path: { type: 'string' },
        edits: {
          type: 'array',
          items: {
            type: 'object',
            properties: { oldText: { type: 'string' }, newText: { type: 'string' } },
            required: ['oldText', 'newText'],
          },
        },
      },
      required: ['path', 'edits'],
    };
  }

  async handle(params, opts = {}) {
    const s = this._workspace.begin();
    if (!params || !params.path) return { success: false, error: 'path is required' };
    const res = await this._workspace.code.editFile(s.workspaceId, params.path, params.edits);
    if (!res.ok) return { success: false, error: res.error, message: `Edit failed: ${res.error}` };
    this._workspace.trackFile(s, res.path, res.valid);
    this._workspace.emitState(opts.emit, s);
    return EditFileTool._result(res);
  }

  static _result(res) {
    const changes = `${res.edits} ${SearchText.plural(res.edits, 'change', 'changes')}`;
    return {
      success: true,
      path: res.path,
      message: res.valid
        ? `Edited ${res.path} (${changes}). Validation clean.`
        : `Edited ${res.path} (${changes}), but validation found problems:\n${res.summary}\nFix them with another edit_file.`,
      summary: `${res.path} · ${res.edits} ${SearchText.plural(res.edits, 'edit', 'edits')}${res.valid ? '' : ' · issues'}`,
    };
  }
}

module.exports = EditFileTool;
