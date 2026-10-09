const CodeTool = require('../CodeTool');

class WriteFileTool extends CodeTool {
  constructor({ workspace }) {
    super();
    this._workspace = workspace;
  }

  get name() {
    return 'write_file';
  }

  get description() {
    return 'Create a new file (or fully overwrite an existing one) in the project. For changes to an '
      + 'existing file prefer edit_file; use write_file for new files or full rewrites. Overwriting an '
      + 'existing file requires that you read it first, so no unseen work is lost.';
  }

  get inputSchema() {
    return {
      type: 'object',
      properties: { path: { type: 'string' }, content: { type: 'string' } },
      required: ['path', 'content'],
    };
  }

  async handle(params, opts = {}) {
    const s = this._workspace.begin();
    if (!params || !params.path) return { success: false, error: 'path is required' };
    const content = params.content == null ? '' : params.content;
    const res = await this._workspace.code.writeFile(s.workspaceId, params.path, content);
    if (res.error) return { success: false, error: res.error, message: `Write failed: ${res.error}` };
    this._workspace.trackFile(s, res.path, res.ok);
    this._workspace.emitState(opts.emit, s);
    return {
      success: true,
      path: res.path,
      message: res.ok
        ? `Wrote ${res.path} (${res.bytes} bytes). Validation clean.`
        : `Wrote ${res.path} (${res.bytes} bytes), but validation found problems:\n${res.summary}`,
      summary: `${res.path} · ${res.bytes} bytes${res.ok ? '' : ' · issues'}`,
    };
  }
}

module.exports = WriteFileTool;
