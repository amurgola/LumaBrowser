const CodeTool = require('../CodeTool');

class ProjectOverviewTool extends CodeTool {
  constructor({ workspace }) {
    super();
    this._workspace = workspace;
  }

  get name() {
    return 'project_overview';
  }

  get description() {
    return 'Get a quick structural map of the project: file count, breakdown by file type, top-level '
      + 'folders, likely entrypoints and manifests. Call this first to orient yourself before exploring.';
  }

  async handle() {
    const s = this._workspace.begin();
    const m = await this._workspace.code.projectMap(s.workspaceId);
    const topExts = m.byExtension.slice(0, 3).map((e) => e.name).join(', ');
    return {
      success: true,
      message: ProjectOverviewTool._lines(s, m).join('\n'),
      summary: `${m.fileCount}${m.limitReached ? '+' : ''} files${topExts ? ` · ${topExts}` : ''}`,
    };
  }

  static _lines(s, m) {
    const exts = m.byExtension.slice(0, 8).map((e) => `${e.name} (${e.count})`).join(', ');
    const dirs = m.topDirs.slice(0, 12).map((d) => `${d.name}/ (${d.count})`).join(', ');
    return [
      `Project root: ${s.dir}`,
      `Files: ${m.fileCount}${m.limitReached ? '+ (capped)' : ''}`,
      exts ? `Types: ${exts}` : null,
      dirs ? `Top-level: ${dirs}` : null,
      m.entrypoints.length ? `Entrypoints: ${m.entrypoints.join(', ')}` : null,
      m.manifests.length ? `Manifests: ${m.manifests.join(', ')}` : null,
      m.readme ? `Readme: ${m.readme}` : null,
    ].filter(Boolean);
  }
}

module.exports = ProjectOverviewTool;
