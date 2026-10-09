const GitOptionScan = require('./GitOptionScan');

class GitReadForms {
  static OPTION_HAZARDS = Object.freeze({
    diffOutput: { long: ['--output', '--ext-diff', '--textconv'], short: [] },
    attribution: { long: ['--textconv'], short: [] },
    search: { long: ['--open-files-in-pager', '--textconv'], short: ['O'], values: ['-e', '-f'] },
    objectDump: { long: ['--textconv', '--filters'], short: [] },
  });

  static BRANCH_LIST = Object.freeze({
    switches: ['--list', '-l', '-a', '--all', '-r', '--remotes', '-v', '--verbose', '--show-current', '-i', '--ignore-case',
      '--no-color', '--no-column', '--no-abbrev', '-q', '--quiet', '--omit-empty'],
    values: ['--points-at', '--sort', '--format'],
    attached: ['--color', '--column', '--abbrev'],
    lastArgDefault: ['--merged', '--no-merged', '--contains', '--no-contains'],
    implyList: ['--list', '-l', '--merged', '--no-merged', '--contains', '--no-contains', '--points-at'],
  });

  static TAG_LIST = Object.freeze({
    switches: ['--list', '-l', '-i', '--ignore-case', '--no-color', '--no-column', '--omit-empty'],
    values: ['--points-at', '--sort', '--format'],
    attached: ['--color', '--column', '-n'],
    lastArgDefault: ['--merged', '--no-merged', '--contains', '--no-contains'],
    implyList: ['--list', '-l', '-n', '--merged', '--no-merged', '--contains', '--no-contains', '--points-at'],
  });

  static CONFIG_SHARED = Object.freeze({
    switches: ['--global', '--system', '--local', '--worktree', '--show-origin', '--show-scope', '--name-only', '-z', '--null',
      '--includes', '--no-includes', '--bool', '--int', '--bool-or-int', '--path', '--expiry-date', '--fixed-value',
      '--all', '--regexp', '--show-names', '--no-show-names', '--no-type'],
    values: ['--file', '-f', '--blob', '--type', '--default', '--value', '--url'],
  });

  static CONFIG_READ_MODES = ['--get', '--get-all', '--get-regexp', '--get-urlmatch', '--get-color', '--get-colorbool', '--list', '-l'];
  static CONFIG_READ_VERBS = new Set(['get', 'list']);

  static SYMBOLIC_REF_READ = Object.freeze({ switches: ['-q', '--quiet', '--short', '--recurse', '--no-recurse'] });

  static PROFILES = Object.freeze({
    log: { form: 'always', hazards: 'diffOutput' },
    show: { form: 'always', hazards: 'diffOutput' },
    diff: { form: 'always', hazards: 'diffOutput' },
    whatchanged: { form: 'always', hazards: 'diffOutput' },
    'diff-tree': { form: 'always', hazards: 'diffOutput' },
    'diff-index': { form: 'always', hazards: 'diffOutput' },
    'diff-files': { form: 'always', hazards: 'diffOutput' },
    'range-diff': { form: 'always', hazards: 'diffOutput' },
    shortlog: { form: 'always', hazards: 'diffOutput' },
    cherry: { form: 'always' },
    'show-branch': { form: 'always' },
    blame: { form: 'always', hazards: 'attribution' },
    annotate: { form: 'always', hazards: 'attribution' },
    grep: { form: 'always', hazards: 'search' },
    'cat-file': { form: 'always', hazards: 'objectDump' },
    'rev-parse': { form: 'always' },
    'rev-list': { form: 'always' },
    'ls-files': { form: 'always' },
    'ls-tree': { form: 'always' },
    'name-rev': { form: 'always' },
    'merge-base': { form: 'always' },
    'for-each-ref': { form: 'always' },
    'show-ref': { form: 'always' },
    describe: { form: 'always' },
    'count-objects': { form: 'always' },
    'verify-commit': { form: 'always' },
    'verify-tag': { form: 'always' },
    status: { form: 'always' },
    'check-ignore': { form: 'always' },
    'check-attr': { form: 'always' },
    'check-mailmap': { form: 'always' },
    'check-ref-format': { form: 'always' },
    var: { form: 'always' },
    version: { form: 'always' },
    help: { form: 'always' },
    branch: { form: 'list', spec: 'BRANCH_LIST' },
    tag: { form: 'list', spec: 'TAG_LIST' },
    remote: { form: 'verb', verbs: ['show', 'get-url'], leading: ['-v', '--verbose'], bareReads: true },
    stash: { form: 'verb', verbs: ['list', 'show'], leading: [], bareReads: false, hazards: 'diffOutput' },
    worktree: { form: 'verb', verbs: ['list'], leading: [], bareReads: true },
    submodule: { form: 'verb', verbs: ['status', 'summary'], leading: ['-q', '--quiet'], bareReads: true },
    notes: { form: 'verb', verbs: ['list', 'show'], leading: [], leadingValues: ['--ref'], bareReads: true },
    reflog: { form: 'reflog', hazards: 'diffOutput' },
    config: { form: 'config' },
    'symbolic-ref': { form: 'symbolicRef' },
  });

  static REFLOG_WRITE_VERBS = new Set(['expire', 'delete', 'drop']);

  static MAY_CONTACT_REMOTE = new Set(['remote', 'submodule']);

  static reads(subcommand, rest) {
    const profile = GitReadForms._profileOf(subcommand);
    if (!profile) return false;
    if (GitReadForms.hazardIn(profile, rest)) return false;
    return GitReadForms._formReads(profile, rest);
  }

  static staysLocal(subcommand) {
    return GitReadForms._profileOf(subcommand) !== null && !GitReadForms.MAY_CONTACT_REMOTE.has(subcommand);
  }

  static hazardIn(profile, rest) {
    return Boolean(profile.hazards) && GitOptionScan.has(rest, GitReadForms.OPTION_HAZARDS[profile.hazards]);
  }

  static _profileOf(subcommand) {
    return Object.prototype.hasOwnProperty.call(GitReadForms.PROFILES, subcommand) ? GitReadForms.PROFILES[subcommand] : null;
  }

  static _formReads(profile, rest) {
    switch (profile.form) {
      case 'always': return true;
      case 'list': return GitReadForms._listReads(GitReadForms[profile.spec], rest);
      case 'verb': return GitReadForms._verbReads(profile, rest);
      case 'reflog': return GitReadForms._reflogReads(rest);
      case 'config': return GitReadForms._configReads(rest);
      case 'symbolicRef': return GitReadForms._symbolicRefReads(rest);
      default: return false;
    }
  }

  static _listReads(spec, rest) {
    const scan = GitOptionScan.walk(rest, spec);
    if (!scan.known) return false;
    return scan.positionals.length === 0 || spec.implyList.some((option) => scan.seen.has(option));
  }

  static _verbReads(profile, rest) {
    const leading = { switches: profile.leading, values: profile.leadingValues || [] };
    const verbAt = GitReadForms._firstPositionalIndex(rest, leading);
    const scan = GitOptionScan.walk(rest.slice(0, verbAt), leading);
    if (!scan.known) return false;
    if (verbAt >= rest.length) return profile.bareReads;
    return profile.verbs.includes(rest[verbAt]);
  }

  static _reflogReads(rest) {
    const first = rest.find((word) => !word.startsWith('-'));
    return !GitReadForms.REFLOG_WRITE_VERBS.has(first);
  }

  static _configReads(rest) {
    if (rest.length === 0) return false;
    if (GitReadForms.CONFIG_READ_VERBS.has(rest[0])) return GitOptionScan.walk(rest.slice(1), GitReadForms.CONFIG_SHARED).known;
    const spec = { ...GitReadForms.CONFIG_SHARED, switches: [...GitReadForms.CONFIG_SHARED.switches, ...GitReadForms.CONFIG_READ_MODES] };
    const scan = GitOptionScan.walk(rest, spec);
    if (!scan.known) return false;
    if (GitReadForms.CONFIG_READ_MODES.some((mode) => scan.seen.has(mode))) return true;
    return scan.positionals.length === 1 && scan.positionals[0].includes('.');
  }

  static _symbolicRefReads(rest) {
    const scan = GitOptionScan.walk(rest, GitReadForms.SYMBOLIC_REF_READ);
    return scan.known && scan.positionals.length === 1;
  }

  static _firstPositionalIndex(rest, spec) {
    for (let i = 0; i < rest.length; i++) {
      if (!rest[i].startsWith('-')) return i;
      if (spec.values.includes(rest[i])) i++;
    }
    return rest.length;
  }
}

module.exports = GitReadForms;
