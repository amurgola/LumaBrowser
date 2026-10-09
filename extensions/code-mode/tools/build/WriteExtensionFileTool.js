const CodeTool = require('../CodeTool');
const CodeArtifactPublisher = require('./CodeArtifactPublisher');

class WriteExtensionFileTool extends CodeTool {
  constructor(workspace) {
    super();
    this._workspace = workspace;
  }

  get name() {
    return 'write_extension_file';
  }

  get description() {
    return 'Create or overwrite a file in the extension being built (path relative to the '
      + 'extension folder, e.g. "manifest.js", "main.js", "ui/panel.js"). The file is validated; '
      + 'fix any reported errors with another write before continuing.';
  }

  get inputSchema() {
    return {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Relative file path, e.g. manifest.js' },
        content: { type: 'string', description: 'The full file contents' },
      },
      required: ['path', 'content'],
    };
  }

  async handle(params, opts = {}) {
    const relPath = params && params.path;
    if (!relPath) return { success: false, error: 'path is required' };
    const s = this._workspace.ensure();
    this._markWriting(s, relPath, opts.emit);
    const content = params.content == null ? '' : params.content;
    const res = await this._workspace.code.writeFile(s.workspaceId, relPath, content);
    this._markDone(s, relPath, res, opts.emit);
    CodeArtifactPublisher.publish(opts, s, res.path, content);
    return WriteExtensionFileTool._result(res);
  }

  _markWriting(s, relPath, emit) {
    s.files.set(relPath, { phase: 'writing' });
    this._workspace.emitState(emit, s);
  }

  _markDone(s, relPath, res, emit) {
    if (res.path !== relPath) s.files.delete(relPath);
    s.files.set(res.path, { ok: res.ok, phase: 'done' });
    this._workspace.emitState(emit, s);
  }

  static _result(res) {
    return {
      success: true,
      path: res.path,
      valid: res.ok,
      message: res.ok
        ? `Wrote ${res.path} (${res.bytes} bytes). Validation clean. The file is shown to the user as a code card; do not paste its contents into the chat.`
        : `Wrote ${res.path} (${res.bytes} bytes), but validation found problems:\n${res.summary}\n`
          + 'Fix them with another write_extension_file before continuing.',
    };
  }
}

module.exports = WriteExtensionFileTool;
