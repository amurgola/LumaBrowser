const ProjectTool = require('./ProjectTool');

class GrepTool extends ProjectTool {
  get name() { return 'grep'; }

  get description() {
    return 'Search file contents across the game project with a regular expression. Optionally restrict '
      + 'to a glob (e.g. "src/**/*.js") and set ignoreCase. Returns file:line: text matches.';
  }

  get inputSchema() {
    return {
      type: 'object',
      properties: {
        pattern: { type: 'string', description: 'Regular expression' },
        glob: { type: 'string', description: 'Optional filename glob filter' },
        ignoreCase: { type: 'boolean' },
        maxMatches: { type: 'number' },
      },
      required: ['pattern'],
    };
  }

  async run(params) {
    const s = this._session();
    let res;
    try { res = await this._code.grep(s.workspaceId, params); } catch (e) { return { success: false, error: e.message }; }
    if (!res.matches.length) {
      return { success: true, message: `No matches for /${params.pattern}/.${ProjectTool._skippedNote(res)}`, summary: `/${params.pattern}/ · no matches` };
    }
    const body = res.matches.map((m) => `${m.file}:${m.line}: ${m.text}`).join('\n');
    const capped = res.limitReached ? '\n[Match limit reached; narrow the pattern or set a glob for more.]' : '';
    const n = res.matches.length;
    return {
      success: true,
      noCompact: true,
      message: this._bounded(body, capped),
      summary: `/${params.pattern}/ · ${n}${res.limitReached ? '+' : ''} match${ProjectTool._plural(n, '', 'es')}`,
    };
  }
}

module.exports = GrepTool;
