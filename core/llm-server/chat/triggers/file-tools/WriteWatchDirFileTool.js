const fsp = require('fs').promises;
const path = require('path');
const WatchFolder = require('../file/WatchFolder');

class WriteWatchDirFileTool {
  static NAME = 'write_file_in_watch_dir';
  static WRITE_MAX_CHARS = 1024 * 1024;

  constructor(dir) {
    this._dir = dir;
  }

  definition() {
    return {
      name: WriteWatchDirFileTool.NAME,
      mutating: true,
      description: 'Write text to a file inside the watched folder (create or overwrite), or append '
        + 'with `append` true. `path` is relative to the watched folder or absolute inside it; '
        + 'anything outside is refused. Sub-folders are created as needed. Writing the triggering '
        + 'file itself may fire this trigger again if `change` events are on.',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File to write, relative to the watched folder' },
          content: { type: 'string', description: 'Text to write or append' },
          append: { type: 'boolean', description: 'Append instead of overwrite (default false)' },
        },
        required: ['path', 'content'],
      },
      handler: (params) => this.execute(params),
    };
  }

  async execute(params = {}) {
    if (!params.path) return { success: false, error: 'path is required' };
    const content = String(params.content == null ? '' : params.content);
    if (content.length > WriteWatchDirFileTool.WRITE_MAX_CHARS) return { success: false, error: 'content too large' };
    const target = this._resolveTarget(String(params.path));
    if (target.error) return { success: false, error: target.error };
    try {
      await WriteWatchDirFileTool._write(target.abs, content, !!params.append);
    } catch (err) {
      return { success: false, error: err.message };
    }
    const stat = await fsp.stat(target.abs);
    return { success: true, path: target.abs, name: path.basename(target.abs), size: stat.size, appended: !!params.append };
  }

  _resolveTarget(candidate) {
    let abs;
    try { abs = WatchFolder.resolveInside(this._dir, candidate); } catch (err) { return { error: err.message }; }
    if (abs === this._dir) return { error: 'path must name a file' };
    return { abs };
  }

  static async _write(abs, content, append) {
    await fsp.mkdir(path.dirname(abs), { recursive: true });
    if (append) await fsp.appendFile(abs, content, 'utf8');
    else await fsp.writeFile(abs, content, 'utf8');
  }
}

module.exports = WriteWatchDirFileTool;
