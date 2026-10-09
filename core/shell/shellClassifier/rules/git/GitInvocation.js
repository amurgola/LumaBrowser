class GitInvocation {
  static GLOBAL_OPTIONS = Object.freeze({
    '--version': { effect: 'info' },
    '-v': { effect: 'info' },
    '--help': { effect: 'info' },
    '-h': { effect: 'info' },
    '--html-path': { effect: 'info' },
    '--man-path': { effect: 'info' },
    '--info-path': { effect: 'info' },
    '--list-cmds': { effect: 'info' },
    '-c': { effect: 'config', separate: true },
    '--config-env': { effect: 'config', separate: true },
    '-C': { effect: 'location', separate: true },
    '--git-dir': { effect: 'location', separate: true },
    '--work-tree': { effect: 'location', separate: true },
    '--namespace': { effect: 'location', separate: true },
    '--attr-source': { effect: 'location', separate: true },
    '--super-prefix': { effect: 'location', separate: true },
    '--exec-path': { effect: 'program-path' },
    '-p': { effect: 'switch' },
    '--paginate': { effect: 'switch' },
    '-P': { effect: 'switch' },
    '--no-pager': { effect: 'switch' },
    '--bare': { effect: 'switch' },
    '--no-replace-objects': { effect: 'switch' },
    '--no-lazy-fetch': { effect: 'switch' },
    '--no-optional-locks': { effect: 'switch' },
    '--no-advice': { effect: 'switch' },
    '--literal-pathspecs': { effect: 'switch' },
    '--glob-pathspecs': { effect: 'switch' },
    '--noglob-pathspecs': { effect: 'switch' },
    '--icase-pathspecs': { effect: 'switch' },
  });

  static parse(name, args) {
    const program = String(name || '').toLowerCase();
    if (program === 'git') return GitInvocation._parseGlobals(args);
    if (program.startsWith('git-') && program.length > 4) return GitInvocation._dashed(program.slice(4), args);
    return null;
  }

  static isInfoOnly(invocation) {
    return !invocation.subcommand && invocation.globals.length > 0
      && invocation.globals.every((global) => global.effect === 'info' || GitInvocation._printsExecPath(global));
  }

  static _parseGlobals(args) {
    const invocation = GitInvocation._empty();
    let i = 0;
    while (i < args.length && args[i].startsWith('-')) i += GitInvocation._readGlobal(args, i, invocation);
    if (i < args.length) {
      invocation.subcommand = args[i];
      invocation.rest = args.slice(i + 1);
    }
    return invocation;
  }

  static _dashed(subcommand, args) {
    return { ...GitInvocation._empty(), subcommand, rest: args.slice() };
  }

  static _empty() {
    return { globals: [], overrides: [], execPath: null, unknownGlobals: [], subcommand: null, rest: [] };
  }

  static _readGlobal(args, i, invocation) {
    const { option, value, used } = GitInvocation._optionAt(args, i);
    const spec = GitInvocation._specFor(option);
    if (!spec) { invocation.unknownGlobals.push(args[i]); return 1; }
    invocation.globals.push({ option, effect: spec.effect, value });
    if (spec.effect === 'config' && value !== null) invocation.overrides.push(GitInvocation._override(option, value));
    if (spec.effect === 'program-path' && value !== null) invocation.execPath = value;
    return used;
  }

  static _optionAt(args, i) {
    const word = args[i];
    const eq = word.startsWith('--') ? word.indexOf('=') : -1;
    if (eq !== -1) return { option: word.slice(0, eq), value: word.slice(eq + 1), used: 1 };
    const spec = GitInvocation._specFor(word);
    if (spec && spec.separate) {
      return { option: word, value: i + 1 < args.length ? args[i + 1] : null, used: 2 };
    }
    return { option: word, value: null, used: 1 };
  }

  static _override(option, text) {
    const eq = text.indexOf('=');
    const key = (eq === -1 ? text : text.slice(0, eq)).trim();
    const fromEnvironment = option === '--config-env';
    const value = eq === -1 ? 'true' : text.slice(eq + 1);
    return { via: option, key, value: fromEnvironment ? null : value, environmentVariable: fromEnvironment ? value : null };
  }

  static _specFor(option) {
    return Object.prototype.hasOwnProperty.call(GitInvocation.GLOBAL_OPTIONS, option) ? GitInvocation.GLOBAL_OPTIONS[option] : null;
  }

  static _printsExecPath(global) {
    return global.effect === 'program-path' && global.value === null;
  }
}

module.exports = GitInvocation;
