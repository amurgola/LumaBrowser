const CodeTool = require('../CodeTool');
const SearchText = require('./SearchText');

class FindTool extends CodeTool {
  static LIMIT_NOTE = 'Result limit reached; narrow the glob for more.';

  constructor({ workspace, truncator }) {
    super();
    this._workspace = workspace;
    this._truncator = truncator;
  }

  get name() {
    return 'find';
  }

  get description() {
    return 'List files in the project matching a glob (e.g. "src/**/*.ts"). Returns relative paths.';
  }

  get inputSchema() {
    return {
      type: 'object',
      properties: { glob: { type: 'string' }, maxResults: { type: 'number' } },
      required: ['glob'],
    };
  }

  async handle(params) {
    const s = this._workspace.begin();
    const res = await this._workspace.code.find(s.workspaceId, params);
    if (!res.files.length) return FindTool._noFiles(params, res);
    const count = res.files.length;
    return {
      success: true,
      noCompact: true,
      message: SearchText.boundedBody(this._truncator, res.files, res.limitReached, FindTool.LIMIT_NOTE),
      summary: `${params.glob} · ${count}${res.limitReached ? '+' : ''} ${SearchText.plural(count, 'file', 'files')}`,
    };
  }

  static _noFiles(params, res) {
    return {
      success: true,
      message: `No files match ${params.glob}.${SearchText.skippedNote(res)}`,
      summary: `${params.glob} · no files`,
    };
  }
}

module.exports = FindTool;
