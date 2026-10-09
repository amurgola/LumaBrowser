const ProjectTool = require('./ProjectTool');

class FindTool extends ProjectTool {
  get name() { return 'find'; }

  get description() {
    return 'List files in the game project matching a glob (e.g. "src/**/*.js"). Returns relative paths.';
  }

  get inputSchema() {
    return { type: 'object', properties: { glob: { type: 'string' }, maxResults: { type: 'number' } }, required: ['glob'] };
  }

  async run(params) {
    const s = this._session();
    const res = await this._code.find(s.workspaceId, params);
    if (!res.files.length) {
      return { success: true, message: `No files match ${params.glob}.${ProjectTool._skippedNote(res)}`, summary: `${params.glob} · no files` };
    }
    const capped = res.limitReached ? '\n[Result limit reached; narrow the glob for more.]' : '';
    const n = res.files.length;
    return {
      success: true,
      noCompact: true,
      message: this._bounded(res.files.join('\n'), capped),
      summary: `${params.glob} · ${n}${res.limitReached ? '+' : ''} file${ProjectTool._plural(n, '', 's')}`,
    };
  }
}

module.exports = FindTool;
