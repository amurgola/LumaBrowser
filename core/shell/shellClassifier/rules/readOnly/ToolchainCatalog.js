const ReadOnlyCatalog = require('./ReadOnlyCatalog');
const PredicateProfile = require('./PredicateProfile');

class ToolchainCatalog extends ReadOnlyCatalog {
  static first(args) {
    return args[0] || '';
  }

  static firstIn(list) {
    return (args) => list.includes(ToolchainCatalog.first(args));
  }

  static onlyFlags(list) {
    return (args) => args.length > 0 && args.every((word) => list.includes(word));
  }

  static leadingFlag(list) {
    return (args) => args.length > 0 && list.includes(args[0]);
  }

  static anyOf(list) {
    return (args) => args.some((word) => list.includes(word));
  }

  static RUNTIMES = {
    node: ToolchainCatalog.onlyFlags(['-v', '--version', '-h', '--help']),
    python: ToolchainCatalog.leadingFlag(['-V', '--version', '-h', '--help']),
    python3: ToolchainCatalog.leadingFlag(['-V', '--version', '-h', '--help']),
    py: ToolchainCatalog.leadingFlag(['-V', '--version', '-h', '--help', '--list', '-0', '-0p']),
    java: ToolchainCatalog.leadingFlag(['-version', '--version', '-h', '--help', '-X', '-XshowSettings']),
    javac: ToolchainCatalog.leadingFlag(['-version', '--version', '-help', '--help']),
    ruby: ToolchainCatalog.leadingFlag(['-v', '--version', '-h', '--help']),
    php: ToolchainCatalog.leadingFlag(['-v', '--version', '-h', '--help', '-m', '-i', '--ini']),
    perl: ToolchainCatalog.leadingFlag(['-v', '--version', '-h', '--help', '-V']),
    code: ToolchainCatalog.leadingFlag(['-v', '--version', '-h', '--help', '--list-extensions']),
    nvcc: ToolchainCatalog.leadingFlag(['--version', '-V']),
    gcc: ToolchainCatalog.onlyFlags(['--version', '-v', '-dumpversion', '-dumpmachine', '--help']),
    'g++': ToolchainCatalog.onlyFlags(['--version', '-v', '-dumpversion', '-dumpmachine', '--help']),
    clang: ToolchainCatalog.onlyFlags(['--version', '-v', '-dumpversion', '-dumpmachine', '--help']),
    cl: (args) => args.every((word) => /^[/-](\?|help)$/i.test(word)),
    dotnet: ToolchainCatalog.firstIn(['--version', '--info', '--list-sdks', '--list-runtimes', '-h', '--help']),
  };

  static PACKAGE_MANAGERS = {
    npm: (args) => ToolchainCatalog.firstIn(['-v', '--version', 'ls', 'list', 'll', 'la', 'view', 'info', 'show', 'outdated', 'why', 'explain',
      'help', 'root', 'prefix', 'bin', 'search', 'ping', 'fund', 'doctor'])(args)
      || (args[0] === 'config' && ['get', 'list', 'ls'].includes(args[1] || ''))
      || (args[0] === 'audit' && args[1] !== 'fix'),
    pnpm: (args) => ToolchainCatalog.firstIn(['-v', '--version', 'ls', 'list', 'why', 'outdated', 'view', 'info', 'help', 'root', 'bin', 'audit'])(args)
      && !(args[0] === 'audit' && args.includes('--fix')),
    yarn: ToolchainCatalog.firstIn(['-v', '--version', 'list', 'why', 'outdated', 'info', 'help', 'bin', 'audit', 'licenses']),
    bun: (args) => ToolchainCatalog.firstIn(['-v', '--version', 'pm', 'outdated'])(args)
      && !(args[0] === 'pm' && ['cache', 'trust', 'untrusted'].includes(args[1] || '') && args[2] === 'rm'),
    pip: (args) => ToolchainCatalog.firstIn(['-V', '--version', 'list', 'show', 'freeze', 'check', 'config', 'debug', 'help', 'index'])(args)
      && !(args[0] === 'config' && ['set', 'unset', 'edit'].includes(args[1] || '')),
    uv: (args) => ToolchainCatalog.firstIn(['-V', '--version', 'tree', 'help'])(args)
      || (args[0] === 'pip' && ['list', 'show', 'freeze', 'check', 'tree'].includes(args[1] || '')),
    poetry: (args) => ToolchainCatalog.firstIn(['-V', '--version', 'show', 'check', 'env', 'about', 'help', 'search'])(args)
      && !(args[0] === 'env' && ['remove', 'use'].includes(args[1] || '')),
    cargo: ToolchainCatalog.firstIn(['--version', '-V', 'tree', 'metadata', 'search', 'help', '--list', 'pkgid', 'locate-project']),
    go: (args) => ToolchainCatalog.firstIn(['version', 'env', 'list', 'doc', 'help', 'vet'])(args) && !(args[0] === 'env' && ['-w', '-u'].includes(args[1])),
    gem: ToolchainCatalog.firstIn(['-v', '--version', 'list', 'search', 'which', 'env', 'help', 'info', 'outdated', 'dependency', 'contents']),
    composer: ToolchainCatalog.firstIn(['-V', '--version', 'show', 'outdated', 'why', 'why-not', 'validate', 'licenses', 'depends', 'prohibits',
      'check-platform-reqs', 'diagnose', 'help', 'list', 'search', 'status']),
  };

  static BUILD_TOOLS = {
    make: ToolchainCatalog.anyOf(['-n', '--dry-run', '-v', '--version', '-q', '--question']),
    cmake: (args) => ToolchainCatalog.anyOf(['--version', '--help'])(args) || (args[0] === '-E' && args[1] === 'capabilities'),
    tsc: ToolchainCatalog.anyOf(['-v', '--version', '--noEmit', '--listFiles', '--showConfig']),
    eslint: (args) => ToolchainCatalog.anyOf(['-v', '--version', '--print-config'])(args) && !args.includes('--fix'),
    prettier: (args) => ToolchainCatalog.anyOf(['-v', '--version', '--check', '-c', '-l', '--list-different'])(args) && !args.includes('--write') && !args.includes('-w'),
  };

  static PLATFORMS = {
    docker: (args) => (ToolchainCatalog.firstIn(['ps', 'images', 'version', 'info', 'inspect', 'logs', 'top', 'stats', 'port', 'diff', 'history', 'search', 'context'])(args)
      && !(args[0] === 'context' && ['create', 'rm', 'use', 'update'].includes(args[1] || '')))
      || (['image', 'container', 'volume', 'network', 'compose'].includes(args[0]) && ['ls', 'list', 'inspect', 'ps', 'logs', 'config', 'version', 'top', 'images'].includes(args[1] || '')),
    kubectl: (args) => ToolchainCatalog.firstIn(['get', 'describe', 'logs', 'top', 'version', 'cluster-info', 'api-resources', 'api-versions', 'explain', 'config'])(args)
      && !(args[0] === 'config' && /^(set|use|delete|rename|unset)/.test(args[1] || '')),
    helm: ToolchainCatalog.firstIn(['list', 'ls', 'status', 'history', 'get', 'show', 'version', 'env', 'search', 'template', 'lint']),
    terraform: (args) => ToolchainCatalog.firstIn(['version', 'validate', 'fmt', 'show', 'output', 'providers', 'graph', 'plan'])(args)
      && !(args[0] === 'fmt' && !args.includes('-check'))
      && !(args[0] === 'plan' && args.some((word) => word.startsWith('-out'))),
    aws: (args) => ToolchainCatalog.firstIn(['--version', 'sts', 'help'])(args) || /^(describe|list|get)-/.test(args[1] || ''),
    gcloud: (args) => ToolchainCatalog.firstIn(['version', 'info', 'help'])(args) || ToolchainCatalog.anyOf(['list', 'describe'])(args),
    az: (args) => (ToolchainCatalog.firstIn(['--version', 'version', 'account'])(args) && !(args[0] === 'account' && args[1] === 'set'))
      || ToolchainCatalog.anyOf(['list', 'show'])(args),
    gh: (args) => ToolchainCatalog._githubReads(args),
    wsl: ToolchainCatalog.onlyFlags(['-l', '--list', '-v', '--verbose', '--status', '--version', '--help']),
  };

  static SYSTEM_PACKAGES = {
    choco: ToolchainCatalog.firstIn(['list', 'search', 'info', 'outdated', '-v', '--version']),
    winget: ToolchainCatalog.firstIn(['list', 'search', 'show', '--version', '-v', '--info']),
    scoop: ToolchainCatalog.firstIn(['list', 'search', 'info', 'status', 'which', 'help', 'cat']),
    brew: ToolchainCatalog.firstIn(['list', 'ls', 'info', 'search', 'deps', 'uses', 'outdated', 'doctor', 'config', '--version', '-v', '--prefix', '--cellar', 'leaves', 'which']),
    apt: ToolchainCatalog.firstIn(['list', 'search', 'show', 'policy', 'depends', 'rdepends', '--version', '-v']),
    'apt-get': ToolchainCatalog.anyOf(['--dry-run', '-s', '--simulate']),
    'apt-cache': () => true,
    dpkg: ToolchainCatalog.anyOf(['-l', '--list', '-s', '--status', '-L', '--listfiles', '-S', '--search', '-I', '--info', '-c', '--contents']),
    pacman: (args) => args.some((word) => /^-Q/.test(word) || /^-S[sip]+$/.test(word)),
    dnf: (args) => ToolchainCatalog.firstIn(['list', 'search', 'info', 'repolist', 'check-update', 'provides', 'history', 'deplist'])(args)
      && !(args[0] === 'history' && ['undo', 'rollback', 'redo'].includes(args[1] || '')),
  };

  static SERVICES = {
    systemctl: (args) => ['status', 'show', 'list-units', 'list-unit-files', 'is-active', 'is-enabled', 'is-failed', 'cat', 'list-timers',
      'list-sockets', 'list-dependencies', '--version'].includes(args.find((word) => !word.startsWith('-')) || ''),
    journalctl: (args) => !args.some((word) => ['--vacuum-size', '--vacuum-time', '--vacuum-files', '--rotate', '--flush', '--sync', '--relinquish-var']
      .some((flag) => word.startsWith(flag))),
    launchctl: ToolchainCatalog.firstIn(['list', 'print', 'blame', 'version', 'print-disabled', 'dumpstate']),
    sc: ToolchainCatalog.firstIn(['query', 'queryex', 'qc', 'qdescription', 'qfailure', 'getdisplayname', 'getkeyname', 'enumdepend', 'showsid']),
    net: (args) => (ToolchainCatalog.firstIn(['user', 'localgroup', 'share', 'view', 'session', 'statistics', 'accounts', 'config', 'file', 'group', 'start'])(args)
      && args.length <= 2) || (args[0] === 'use' && args.length === 1),
    reg: ToolchainCatalog.firstIn(['query', 'compare']),
    schtasks: (args) => args.length === 0 || args[0] === '/query',
    wmic: (args) => !ToolchainCatalog.anyOf(['delete', 'call', 'terminate', 'create', 'set'])(args),
    route: (args) => args.length === 0 || ['print', '-n'].includes(args[0]),
    arp: (args) => !ToolchainCatalog.anyOf(['-d', '-s'])(args),
    netsh: ToolchainCatalog.anyOf(['show', 'dump', 'help', '/?']),
    tasklist: () => true,
    mount: (args) => args.every((word) => ['-l', '-t', '--list'].includes(word)),
    crontab: (args) => args.includes('-l') && !ToolchainCatalog.anyOf(['-r', '-e'])(args),
  };

  static ALIASES = { pip3: 'pip', yum: 'dnf' };

  constructor() {
    super([
      ...ToolchainCatalog._profilesOf([ToolchainCatalog.RUNTIMES, ToolchainCatalog.PACKAGE_MANAGERS, ToolchainCatalog.BUILD_TOOLS,
        ToolchainCatalog.PLATFORMS, ToolchainCatalog.SYSTEM_PACKAGES, ToolchainCatalog.SERVICES]),
      PredicateProfile.never(['npx', 'taskkill'], 'runs or stops programs'),
      PredicateProfile.never(['git'], 'is judged by GitRule'),
    ]);
  }

  static _profilesOf(tables) {
    return tables.flatMap((table) => Object.entries(table).map(([name, test]) => new PredicateProfile(ToolchainCatalog._namesFor(name), test)));
  }

  static _namesFor(name) {
    return [name, ...Object.keys(ToolchainCatalog.ALIASES).filter((alias) => ToolchainCatalog.ALIASES[alias] === name)];
  }

  static _githubReads(args) {
    const writesApi = ['-X', '--method', '-f', '-F', '--field', '--raw-field', '--input'];
    if (args[0] === 'auth') return args[1] === 'status';
    if (args[0] === 'api') return !args.some((word) => writesApi.includes(word));
    if (['--version', 'status', 'search'].includes(args[0])) return true;
    return ['pr', 'issue', 'repo', 'run', 'release', 'workflow', 'gist'].includes(args[0])
      && ['list', 'view', 'status', 'diff', 'checks', 'watch', 'ls'].includes(args[1] || '');
  }
}

module.exports = ToolchainCatalog;
