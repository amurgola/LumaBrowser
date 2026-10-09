class SearchSkipDirs {
  static NAMES = Object.freeze([
    'node_modules', '.git', '.hg', '.svn', 'dist', 'build', 'out', '.next',
    'coverage', '.cache', '.idea', '.vscode', '__pycache__', 'vendor', '.venv',
  ]);

  static WILDCARD = /[*?[\]{}]/;

  static isSkipped(name) {
    return SearchSkipDirs.NAMES.includes(name);
  }

  static explicitDirAllowances(glob) {
    const allowed = new Set();
    for (const segment of String(glob || '').split('/')) {
      if (!segment || SearchSkipDirs.WILDCARD.test(segment)) continue;
      if (SearchSkipDirs.isSkipped(segment)) allowed.add(segment);
    }
    return allowed;
  }

  static effectiveFor(glob) {
    const allowed = SearchSkipDirs.explicitDirAllowances(glob);
    return SearchSkipDirs.NAMES.filter((name) => !allowed.has(name));
  }
}

module.exports = SearchSkipDirs;
