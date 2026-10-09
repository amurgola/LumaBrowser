const ContainerPath = require('../ContainerPath');
const ContainerSearch = require('../ContainerSearch');
const SearchQuery = require('./SearchQuery');

class ContainerCodeSearch {
  static MAX_LISTED_FILES = 50000;

  static find(rootDir, options) {
    const at = ContainerPath.parse(rootDir);
    const filter = SearchQuery.fileFilter(options);
    const limit = SearchQuery.findLimit(options);
    const skipDirs = SearchQuery.skippedDirs(options);
    const listed = ContainerSearch.listFiles(at.container, at.posix, { skipDirs, max: ContainerCodeSearch.MAX_LISTED_FILES });
    const all = listed.files.filter((file) => !filter || filter.test(file)).sort();
    return { files: all.slice(0, limit), limitReached: all.length > limit || listed.limitReached, skippedDirs: skipDirs };
  }

  static grep(rootDir, options) {
    SearchQuery.pattern(options);
    const at = ContainerPath.parse(rootDir);
    const filter = SearchQuery.fileFilter(options);
    const limit = SearchQuery.grepLimit(options);
    const skipDirs = SearchQuery.skippedDirs(options);
    const result = ContainerSearch.grep(at.container, at.posix, { pattern: options.pattern, ignoreCase: options.ignoreCase, skipDirs });
    if (result.error) throw new Error(result.error);
    const all = result.matches.filter((match) => !filter || filter.test(match.file));
    return { matches: all.slice(0, limit), limitReached: all.length > limit, scanned: 0, skippedDirs: skipDirs };
  }
}

module.exports = ContainerCodeSearch;
