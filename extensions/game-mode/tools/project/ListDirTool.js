const ProjectTool = require('./ProjectTool');

class ListDirTool extends ProjectTool {
  get name() { return 'list_dir'; }

  get description() {
    return 'List the immediate contents (one level) of a directory in the game project (default: game root).';
  }

  get inputSchema() { return { type: 'object', properties: { path: { type: 'string' } } }; }

  async run(params) {
    const s = this._session();
    const dir = (params && params.path) || '';
    let entries;
    try { entries = await this._code.listDir(s.workspaceId, dir); } catch (e) { return { success: false, error: e.message }; }
    const body = entries.map((e) => (e.type === 'dir' ? `${e.name}/` : e.name)).join('\n');
    return {
      success: true,
      message: body || '(empty)',
      summary: `${dir || '/'} · ${entries.length} item${ProjectTool._plural(entries.length, '', 's')}`,
    };
  }
}

module.exports = ListDirTool;
