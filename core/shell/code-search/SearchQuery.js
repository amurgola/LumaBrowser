const GlobPattern = require('../GlobPattern');
const SearchSkipDirs = require('../SearchSkipDirs');

class SearchQuery {
  static DEFAULT_GREP_LIMIT = 100;
  static DEFAULT_FIND_LIMIT = 500;

  static pattern(options) {
    const { pattern, ignoreCase } = options;
    if (!pattern || typeof pattern !== 'string') throw new Error('A search pattern is required');
    return new RegExp(pattern, ignoreCase ? 'i' : '');
  }

  static fileFilter(options) {
    return options.glob ? GlobPattern.toRegExp(options.glob) : null;
  }

  static grepLimit(options) {
    return SearchQuery._positiveOr(options.maxMatches, SearchQuery.DEFAULT_GREP_LIMIT);
  }

  static findLimit(options) {
    return SearchQuery._positiveOr(options.maxResults, SearchQuery.DEFAULT_FIND_LIMIT);
  }

  static allowDirs(options) {
    return SearchSkipDirs.explicitDirAllowances(options.glob);
  }

  static skippedDirs(options) {
    return SearchSkipDirs.effectiveFor(options.glob);
  }

  static _positiveOr(value, fallback) {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? n : fallback;
  }
}

module.exports = SearchQuery;
