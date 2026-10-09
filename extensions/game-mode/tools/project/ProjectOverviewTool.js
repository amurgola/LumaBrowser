const ProjectTool = require('./ProjectTool');

class ProjectOverviewTool extends ProjectTool {
  get name() { return 'project_overview'; }

  get description() {
    return 'Get a quick structural map of the game project: file count, breakdown by file type, '
      + 'top-level folders, likely entrypoints and manifests. Call this first to orient yourself.';
  }

  get inputSchema() { return { type: 'object', properties: {} }; }

  async run() {
    const s = this._session();
    const map = await this._code.projectMap(s.workspaceId);
    const count = `${map.fileCount}${map.limitReached ? '+' : ''}`;
    const topExts = map.byExtension.slice(0, 3).map((e) => e.name).join(', ');
    return {
      success: true,
      message: ProjectOverviewTool._lines(s, map).join('\n'),
      summary: `${count} files${topExts ? ` · ${topExts}` : ''}`,
    };
  }

  static _lines(s, map) {
    const exts = map.byExtension.slice(0, 8).map((e) => `${e.name} (${e.count})`).join(', ');
    const dirs = map.topDirs.slice(0, 12).map((d) => `${d.name}/ (${d.count})`).join(', ');
    return [
      `Game root: ${s.dir}`,
      `Files: ${map.fileCount}${map.limitReached ? '+ (capped)' : ''}`,
      exts ? `Types: ${exts}` : null,
      dirs ? `Top-level: ${dirs}` : null,
      map.entrypoints.length ? `Entrypoints: ${map.entrypoints.join(', ')}` : null,
      map.manifests.length ? `Manifests: ${map.manifests.join(', ')}` : null,
      map.readme ? `Readme: ${map.readme}` : null,
    ].filter(Boolean);
  }
}

module.exports = ProjectOverviewTool;
