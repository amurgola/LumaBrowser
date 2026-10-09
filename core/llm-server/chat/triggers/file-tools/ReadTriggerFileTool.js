const fsp = require('fs').promises;
const path = require('path');
const WatchFolder = require('../file/WatchFolder');

class ReadTriggerFileTool {
  static NAME = 'read_trigger_file';
  static READ_MAX_CHARS = 256 * 1024;
  static BINARY_SNIFF_BYTES = 8192;

  constructor(dir, defaultPath) {
    this._dir = dir;
    this._defaultPath = defaultPath;
  }

  definition() {
    return {
      name: ReadTriggerFileTool.NAME,
      description: 'Read a file from the watched folder as text. With no `path` it reads the file '
        + 'that triggered this run. `path` may be relative to the watched folder or absolute '
        + 'inside it; anything outside is refused. Returns up to ' + Math.round(ReadTriggerFileTool.READ_MAX_CHARS / 1024)
        + ' KB (`truncated` true when cut) and refuses binary files.',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File to read (default: the triggering file)' },
          offset: { type: 'number', description: 'Character offset to start from (for long files)' },
        },
      },
      handler: (params) => this.execute(params),
    };
  }

  async execute(params = {}) {
    const target = params.path ? String(params.path) : this._defaultPath;
    if (!target) return { success: false, error: 'no path given and this run has no triggering file' };
    let abs;
    try { abs = WatchFolder.resolveInside(this._dir, target); } catch (err) { return { success: false, error: err.message }; }
    const file = await ReadTriggerFileTool._readFile(abs, target);
    if (file.error) return { success: false, error: file.error };
    return ReadTriggerFileTool._slice(abs, file, params.offset);
  }

  static async _readFile(abs, target) {
    let stat;
    try { stat = await fsp.stat(abs); } catch (_) { return { error: `file not found: ${target}` }; }
    if (!stat.isFile()) return { error: `not a file: ${target}` };
    const buffer = await fsp.readFile(abs);
    if (buffer.subarray(0, ReadTriggerFileTool.BINARY_SNIFF_BYTES).includes(0)) {
      return { error: `binary file (${stat.size} bytes); only text files can be read` };
    }
    return { size: stat.size, text: buffer.toString('utf8') };
  }

  static _slice(abs, { size, text }, rawOffset) {
    const offset = Math.max(0, Math.floor(Number(rawOffset) || 0));
    const content = text.slice(offset, offset + ReadTriggerFileTool.READ_MAX_CHARS);
    return {
      success: true,
      path: abs,
      name: path.basename(abs),
      size,
      chars: text.length,
      offset,
      truncated: offset + content.length < text.length,
      content,
    };
  }
}

module.exports = ReadTriggerFileTool;
