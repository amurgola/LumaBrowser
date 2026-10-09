class ProjectMap {
  static ENTRY_PATTERN = /^(?:src\/)?(?:index|main|app|cli|server)\.[a-z]+$/i;
  static README_PATTERN = /^readme(?:\.md|\.txt)?$/i;
  static MANIFEST_FILES = new Set(['package.json', 'pyproject.toml', 'cargo.toml', 'go.mod', 'pom.xml', 'build.gradle']);
  static MAX_FILES = 2000;
  static ROOT_LABEL = '(root)';

  constructor({ search } = {}) {
    if (!search) throw new Error('ProjectMap requires a CodeSearch');
    this._search = search;
  }

  async build(rootDir) {
    const { files, limitReached } = await this._search.find(rootDir, { maxResults: ProjectMap.MAX_FILES });
    return {
      fileCount: files.length,
      limitReached,
      byExtension: ProjectMap._countBy(files, ProjectMap._extensionOf),
      topDirs: ProjectMap._countBy(files, ProjectMap._topDirOf),
      entrypoints: files.filter((file) => ProjectMap.ENTRY_PATTERN.test(file)),
      manifests: files.filter(ProjectMap._isManifest),
      readme: files.find((file) => ProjectMap.README_PATTERN.test(file)) || null,
    };
  }

  static _isManifest(file) {
    return ProjectMap.MANIFEST_FILES.has(file.toLowerCase());
  }

  static _extensionOf(file) {
    const dot = file.lastIndexOf('.');
    const slash = file.lastIndexOf('/');
    return dot > slash + 1 ? file.slice(dot + 1).toLowerCase() : null;
  }

  static _topDirOf(file) {
    return file.includes('/') ? file.slice(0, file.indexOf('/')) : ProjectMap.ROOT_LABEL;
  }

  static _countBy(files, keyOf) {
    const counts = new Map();
    for (const file of files) {
      const key = keyOf(file);
      if (key != null) counts.set(key, (counts.get(key) || 0) + 1);
    }
    return [...counts].map(([name, count]) => ({ name, count }))
      .sort((a, b) => (b.count - a.count) || a.name.localeCompare(b.name));
  }
}

module.exports = ProjectMap;
