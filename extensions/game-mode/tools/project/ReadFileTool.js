const ProjectTool = require('./ProjectTool');
const FileStamp = require('./FileStamp');

class ReadFileTool extends ProjectTool {
  get name() { return 'read_file'; }

  get description() {
    return 'Read a file from the game project. Optionally paginate with offset (1-indexed first line) '
      + 'and limit (max lines). Output is bounded; a notice tells you how to read further.';
  }

  get inputSchema() {
    return {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Path relative to the game root' },
        offset: { type: 'number', description: 'First line to read (1-indexed)' },
        limit: { type: 'number', description: 'Max lines to read' },
      },
      required: ['path'],
    };
  }

  get onResultEvicted() {
    return (params) => {
      if (!params || !params.path) return;
      const s = this._scope.existingSession();
      if (s && s.readWhole) s.readWhole.delete(params.path);
    };
  }

  async run(params) {
    const s = this._session();
    if (!params || !params.path) return { success: false, error: 'path is required' };
    if (this._alreadyHeld(s, params.path)) return ReadFileTool._alreadyHeldResult(params);
    let slice;
    try {
      slice = this._code.readLines(s.workspaceId, params.path, { offset: params.offset, limit: params.limit });
    } catch (e) {
      return { success: false, error: `Could not read ${params.path}: ${e.message}` };
    }
    const fullBytes = Buffer.byteLength(slice.content, 'utf8');
    if (this._servesWhole(params, fullBytes)) return this._whole(s, params.path, slice, fullBytes);
    return this._page(params, slice, fullBytes);
  }

  _alreadyHeld(s, relPath) {
    const prior = s.readWhole && s.readWhole.get(relPath);
    if (!prior) return false;
    const stampNow = FileStamp.of(s.dir, relPath);
    return !!stampNow && prior.stamp === stampNow && (s.served - prior.at) <= this._budget.wholeReadChars;
  }

  static _alreadyHeldResult(params) {
    console.log(`[game-mode] read_file SKIP (already whole): ${params.path} offset=${params.offset || ''} limit=${params.limit || ''}`);
    return {
      success: true,
      path: params.path,
      message: `You ALREADY have the COMPLETE contents of ${params.path} from an earlier read in this `
        + 'conversation (the whole file, nothing omitted). Do NOT read it again; use what you already have '
        + 'and continue. (If you edit it later, a re-read will return the updated file.)',
      summary: `${params.path} · already read in full`,
    };
  }

  _servesWhole(params, fullBytes) {
    const explicitWhole = !params.offset && !params.limit;
    return explicitWhole && this._budget.wholeFileMaxBytes > 0 && fullBytes <= this._budget.wholeFileMaxBytes;
  }

  _whole(s, relPath, slice, fullBytes) {
    console.log(`[game-mode] read_file WHOLE: ${relPath} fullBytes=${fullBytes} ≤ wholeFileMaxBytes=${this._budget.wholeFileMaxBytes}`);
    if (s.readWhole) s.readWhole.set(relPath, { stamp: FileStamp.of(s.dir, relPath), at: s.served + slice.content.length });
    return {
      success: true,
      path: relPath,
      noCompact: true,
      message: `${relPath}: COMPLETE FILE, all ${slice.totalLines} lines shown below (nothing omitted, not truncated). `
        + `You now have the entire file; do NOT call read_file on this path again.\n${slice.content}\n`
        + `[END OF ${relPath}: complete, ${slice.totalLines} lines. You have read the whole file.]`,
      summary: `${relPath} · ${slice.totalLines} lines (whole)`,
    };
  }

  _page(params, slice, fullBytes) {
    console.log(`[game-mode] read_file BOUNDED: ${params.path} fullBytes=${fullBytes} `
      + `wholeFileMaxBytes=${this._budget.wholeFileMaxBytes} chunkCap=${this._budget.truncator.maxBytes} `
      + `explicitWhole=${!params.offset && !params.limit} offset=${params.offset || ''} limit=${params.limit || ''}`);
    const bounded = this._budget.truncator.truncate(slice.content, { strategy: 'head' });
    const shownEnd = slice.startLine + Math.max(0, bounded.shownLines - 1);
    return {
      success: true,
      path: params.path,
      noCompact: true,
      message: `${params.path} (lines ${slice.startLine}-${shownEnd} of ${slice.totalLines})\n${bounded.text}${ReadFileTool._more(slice, shownEnd)}`,
      summary: `${params.path} · lines ${slice.startLine}-${shownEnd} of ${slice.totalLines}`,
    };
  }

  static _more(slice, shownEnd) {
    if (shownEnd >= slice.totalLines) return '';
    return `\n[Read bounded to lines ${slice.startLine}-${shownEnd} of ${slice.totalLines}. The file is COMPLETE on disk; `
      + 'this is a paging limit, NOT truncated or cut-off code. '
      + `Call read_file again with offset=${shownEnd + 1} to read the rest, and do not describe the code as truncated until you've read to line ${slice.totalLines}.]`;
  }
}

module.exports = ReadFileTool;
