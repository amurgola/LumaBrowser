const CodeTool = require('../CodeTool');
const SearchText = require('./SearchText');

class ListDirTool extends CodeTool {
  constructor({ workspace }) {
    super();
    this._workspace = workspace;
  }

  get name() {
    return 'list_dir';
  }

  get description() {
    return 'List the immediate contents (one level) of a directory in the project (default: project root).';
  }

  get inputSchema() {
    return { type: 'object', properties: { path: { type: 'string' } } };
  }

  async handle(params) {
    const s = this._workspace.begin();
    const relDir = (params && params.path) || '';
    let entries;
    try {
      entries = await this._workspace.code.listDir(s.workspaceId, relDir);
    } catch (e) {
      return { success: false, error: e.message };
    }
    const body = entries.map((e) => (e.type === 'dir' ? `${e.name}/` : e.name)).join('\n');
    return {
      success: true,
      message: body || '(empty)',
      summary: `${relDir || '/'} · ${entries.length} ${SearchText.plural(entries.length, 'item', 'items')}`,
    };
  }
}

module.exports = ListDirTool;
