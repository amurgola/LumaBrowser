const FileChangeTool = require('./FileChangeTool');

class EditFileTool extends FileChangeTool {
  get name() { return 'edit_file'; }

  get description() {
    return 'Make targeted edits to an existing game file. Provide edits as an array of '
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

  async run(params, opts = {}) {
    const s = this._session();
    if (!params || !params.path) return { success: false, error: 'path is required' };
    const res = await this._code.editFile(s.workspaceId, params.path, params.edits);
    if (!res.ok) return { success: false, error: res.error, message: `Edit failed: ${res.error}` };
    this._recordChange(s, res.path, res.valid, opts.emit);
    const notes = FileChangeTool._notes(s, res.path, null);
    const changes = `${res.edits} change${res.edits === 1 ? '' : 's'}`;
    const head = res.valid
      ? `Edited ${res.path} (${changes}). Validation clean.`
      : `Edited ${res.path} (${changes}), but validation found problems:\n${res.summary}\nFix them with another edit_file.`;
    return {
      success: true,
      path: res.path,
      message: head + notes.text,
      summary: `${res.path} · ${res.edits} edit${res.edits === 1 ? '' : 's'}${res.valid ? '' : ' · issues'}${notes.apiNote ? ' · phaser api' : ''}`,
    };
  }
}

module.exports = EditFileTool;
