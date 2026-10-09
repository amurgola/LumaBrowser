const CodeTool = require('../CodeTool');

class ReadFileTool extends CodeTool {
  constructor({ workspace, guard, truncator, wholeFileMaxBytes = 0 }) {
    super();
    this._workspace = workspace;
    this._guard = guard;
    this._truncator = truncator;
    this._wholeFileMaxBytes = wholeFileMaxBytes;
  }

  get name() {
    return 'read_file';
  }

  get description() {
    return 'Read a file from the target project. Optionally paginate with offset (1-indexed first line) '
      + 'and limit (max lines). Output is bounded; a notice tells you how to read further.';
  }

  get inputSchema() {
    return {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Path relative to the project root' },
        offset: { type: 'number', description: 'First line to read (1-indexed)' },
        limit: { type: 'number', description: 'Max lines to read' },
      },
      required: ['path'],
    };
  }

  onResultEvicted(params) {
    if (!params || !params.path) return;
    this._guard.forget(this._workspace.current(), params.path);
  }

  async handle(params) {
    const s = this._workspace.begin();
    if (!params || !params.path) return { success: false, error: 'path is required' };
    if (this._guard.isHeld(s, params.path)) return ReadFileTool._alreadyHeld(params);
    let slice;
    try {
      slice = this._workspace.code.readLines(s.workspaceId, params.path, { offset: params.offset, limit: params.limit });
    } catch (e) {
      return { success: false, error: `Could not read ${params.path}: ${e.message}` };
    }
    if (this._fitsWhole(params, slice)) return this._whole(s, params, slice);
    return this._bounded(params, slice);
  }

  _extraFields() {
    return { onResultEvicted: (params) => this.onResultEvicted(params) };
  }

  _fitsWhole(params, slice) {
    const explicitWhole = !params.offset && !params.limit;
    return explicitWhole && this._wholeFileMaxBytes > 0 && Buffer.byteLength(slice.content, 'utf8') <= this._wholeFileMaxBytes;
  }

  _whole(s, params, slice) {
    console.log(`[code-mode] read_file WHOLE: ${params.path} fullBytes=${Buffer.byteLength(slice.content, 'utf8')} `
      + `≤ wholeFileMaxBytes=${this._wholeFileMaxBytes}`);
    this._guard.record(s, params.path, slice.content.length);
    return {
      success: true,
      path: params.path,
      noCompact: true,
      message: `${params.path}: COMPLETE FILE, all ${slice.totalLines} lines shown below (nothing omitted, not truncated). `
        + `You now have the entire file; do NOT call read_file on this path again.\n${slice.content}\n`
        + `[END OF ${params.path}: complete, ${slice.totalLines} lines. You have read the whole file.]`,
      summary: `${params.path} · ${slice.totalLines} lines (whole)`,
    };
  }

  _bounded(params, slice) {
    this._logBounded(params, slice);
    const bounded = this._truncator.truncate(slice.content, { strategy: 'head' });
    const shownEnd = slice.startLine + Math.max(0, bounded.shownLines - 1);
    return {
      success: true,
      path: params.path,
      noCompact: true,
      message: `${params.path} (lines ${slice.startLine}-${shownEnd} of ${slice.totalLines})\n${bounded.text}`
        + ReadFileTool._continuation(slice, shownEnd),
      summary: `${params.path} · lines ${slice.startLine}-${shownEnd} of ${slice.totalLines}`,
    };
  }

  _logBounded(params, slice) {
    console.log(`[code-mode] read_file BOUNDED: ${params.path} fullBytes=${Buffer.byteLength(slice.content, 'utf8')} `
      + `wholeFileMaxBytes=${this._wholeFileMaxBytes} chunkCap=${this._truncator.maxBytes} `
      + `explicitWhole=${!params.offset && !params.limit} offset=${params.offset || ''} limit=${params.limit || ''}`);
  }

  static _continuation(slice, shownEnd) {
    if (shownEnd >= slice.totalLines) return '';
    return `\n[Read bounded to lines ${slice.startLine}-${shownEnd} of ${slice.totalLines}. The file is COMPLETE on disk; `
      + `this is a paging limit, NOT truncated or cut-off code. Call read_file again with offset=${shownEnd + 1} to read `
      + `the rest, and do not describe the code as truncated until you've read to line ${slice.totalLines}.]`;
  }

  static _alreadyHeld(params) {
    console.log(`[code-mode] read_file SKIP (already whole): ${params.path} offset=${params.offset || ''} limit=${params.limit || ''}`);
    return {
      success: true,
      path: params.path,
      message: `You ALREADY have the COMPLETE contents of ${params.path} from an earlier read in this `
        + 'conversation (the whole file, nothing omitted). Do NOT read it again; use what you already have '
        + 'and continue. (If you edit it later, a re-read will return the updated file.)',
      summary: `${params.path} · already read in full`,
    };
  }
}

module.exports = ReadFileTool;
