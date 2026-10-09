const CodeTool = require('../CodeTool');
const SearchText = require('./SearchText');

class GrepTool extends CodeTool {
  static LIMIT_NOTE = 'Match limit reached; narrow the pattern or set a glob for more.';

  constructor({ workspace, truncator }) {
    super();
    this._workspace = workspace;
    this._truncator = truncator;
  }

  get name() {
    return 'grep';
  }

  get description() {
    return 'Search file contents across the project with a regular expression. Optionally restrict to a '
      + 'glob (e.g. "**/*.js") and set ignoreCase. Returns file:line: text matches.';
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

  async handle(params) {
    const s = this._workspace.begin();
    let res;
    try {
      res = await this._workspace.code.grep(s.workspaceId, params);
    } catch (e) {
      return { success: false, error: e.message };
    }
    if (!res.matches.length) return GrepTool._noMatches(params, res);
    const lines = res.matches.map((m) => `${m.file}:${m.line}: ${m.text}`);
    const count = res.matches.length;
    return {
      success: true,
      noCompact: true,
      message: SearchText.boundedBody(this._truncator, lines, res.limitReached, GrepTool.LIMIT_NOTE),
      summary: `/${params.pattern}/ · ${count}${res.limitReached ? '+' : ''} ${SearchText.plural(count, 'match', 'matches')}`,
    };
  }

  static _noMatches(params, res) {
    return {
      success: true,
      message: `No matches for /${params.pattern}/.${SearchText.skippedNote(res)}`,
      summary: `/${params.pattern}/ · no matches`,
    };
  }
}

module.exports = GrepTool;
