const FileChangeTool = require('./FileChangeTool');

class WriteFileTool extends FileChangeTool {
  get name() { return 'write_file'; }

  get description() {
    return 'Create a new file (or fully overwrite an existing one) in the game project. For changes to '
      + 'an existing file prefer edit_file; use write_file for new files or full rewrites. Overwriting an '
      + 'existing file requires that you read it first, so no unseen work is lost.';
  }

  get inputSchema() {
    return { type: 'object', properties: { path: { type: 'string' }, content: { type: 'string' } }, required: ['path', 'content'] };
  }

  async run(params, opts = {}) {
    const s = this._session();
    if (!params || !params.path) return { success: false, error: 'path is required' };
    const content = params.content == null ? '' : params.content;
    const res = await this._code.writeFile(s.workspaceId, params.path, content);
    if (res.error) return { success: false, error: res.error, message: `Write failed: ${res.error}` };
    this._recordChange(s, res.path, res.ok, opts.emit);
    const notes = FileChangeTool._notes(s, res.path, String(content));
    const head = res.ok
      ? `Wrote ${res.path} (${res.bytes} bytes). Validation clean.`
      : `Wrote ${res.path} (${res.bytes} bytes), but validation found problems:\n${res.summary}`;
    return {
      success: true,
      path: res.path,
      message: head + notes.text,
      summary: `${res.path} · ${res.bytes} bytes${res.ok ? '' : ' · issues'}${notes.apiNote ? ' · phaser api' : ''}`,
    };
  }
}

module.exports = WriteFileTool;
