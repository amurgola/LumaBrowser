const DockerExec = require('./DockerExec');

class ContainerSearch {
  static DEFAULT_MAX_FILES = 5000;

  static ERE_TRANSLATIONS = [
    [/\\d/g, '[0-9]'],
    [/\\D/g, '[^0-9]'],
    [/\\s/g, '[[:space:]]'],
    [/\\S/g, '[^[:space:]]'],
  ];

  static listFiles(container, posixRoot, { skipDirs, max = ContainerSearch.DEFAULT_MAX_FILES } = {}) {
    const argv = ['find', '.', ...ContainerSearch._pruneArgs(skipDirs), '-type', 'f', '-print'];
    const result = DockerExec.exec(container, argv, { workdir: posixRoot });
    const all = result.stdout.toString('utf8').split('\n').filter(Boolean).map(ContainerSearch._stripDotSlash);
    return { files: all.slice(0, max), limitReached: all.length > max };
  }

  static grep(container, posixRoot, { pattern, ignoreCase, skipDirs } = {}) {
    const result = DockerExec.exec(container, ContainerSearch._grepArgv(pattern, ignoreCase, skipDirs), { workdir: posixRoot });
    if (ContainerSearch._grepFailed(result)) {
      return { matches: [], error: result.stderr.trim() || 'grep failed in the container' };
    }
    return { matches: ContainerSearch._parseMatches(result.stdout.toString('utf8')), error: null };
  }

  static toEre(pattern) {
    return ContainerSearch.ERE_TRANSLATIONS.reduce((text, [from, to]) => text.replace(from, to), String(pattern));
  }

  static _grepArgv(pattern, ignoreCase, skipDirs) {
    const flags = ignoreCase ? '-HnEi' : '-HnE';
    const prune = ContainerSearch._pruneArgs(skipDirs);
    return ['find', '.', ...prune, '-type', 'f', '-exec', 'grep', flags, '-e', ContainerSearch.toEre(pattern), '{}', '+'];
  }

  static _grepFailed(result) {
    return result.status !== 0 && result.status !== 1 && !result.stdout.length;
  }

  static _parseMatches(text) {
    const matches = [];
    for (const line of text.split('\n')) {
      if (line.indexOf('\0') !== -1) continue;
      const match = /^(?:\.\/)?([^:]+):(\d+):(.*)$/.exec(line);
      if (match) matches.push({ file: match[1], line: Number(match[2]), text: match[3] });
    }
    return matches;
  }

  static _pruneArgs(skipDirs) {
    const names = [...(skipDirs || [])];
    if (!names.length) return [];
    const args = ['('];
    names.forEach((name, i) => {
      if (i) args.push('-o');
      args.push('-name', name);
    });
    args.push(')', '-type', 'd', '-prune', '-o');
    return args;
  }

  static _stripDotSlash(file) {
    return file.replace(/^\.\//, '');
  }
}

module.exports = ContainerSearch;
