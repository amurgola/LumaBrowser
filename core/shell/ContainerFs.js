const ContainerPath = require('./ContainerPath');
const DockerExec = require('./DockerExec');

class ContainerFs {
  static METHODS = ['statSync', 'existsSync', 'readFileSync', 'writeFileSync', 'mkdirSync', 'readdirSync', 'rmSync'];

  static LIST_SCRIPT = 'cd "$1" 2>/dev/null || exit 2; for f in * .[!.]* ..?*; do '
    + '[ -e "$f" ] || continue; '
    + 'if [ -d "$f" ]; then printf "d 0 %s\\n" "$f"; '
    + 'elif [ -f "$f" ]; then printf "f %s %s\\n" "$(stat -c %s "$f" 2>/dev/null || echo 0)" "$f"; fi; done';

  static READ_SCRIPT = '[ -d "$1" ] && exit 21; [ -e "$1" ] || exit 2; exec cat -- "$1"';
  static EXIT_IS_DIRECTORY = 21;
  static EXIT_MISSING = 2;

  static routed(realFs) {
    return new Proxy(realFs, {
      get(target, prop) {
        const real = target[prop];
        if (!ContainerFs.METHODS.includes(prop)) return real;
        return (p, ...rest) => (ContainerPath.isContainerPath(p) ? ContainerFs[prop](p, ...rest) : real.call(target, p, ...rest));
      },
    });
  }

  static statSync(p) {
    const at = ContainerFs._require(p, 'stat');
    const result = DockerExec.exec(at.container, ['stat', '-L', '-c', '%F|%s|%Y|%a', '--', at.posix]);
    if (result.status !== 0) throw ContainerFs._statError(p, result);
    const [kind, size, mtime, mode] = result.stdout.toString('utf8').trim().split('|');
    return ContainerFs._makeStat(kind, size, mtime, mode);
  }

  static existsSync(p) {
    const at = ContainerPath.parse(p);
    if (!at) return false;
    return DockerExec.exec(at.container, ['test', '-e', at.posix]).status === 0;
  }

  static readFileSync(p, options) {
    const at = ContainerFs._require(p, 'open');
    const result = DockerExec.sh(at.container, ContainerFs.READ_SCRIPT, [at.posix]);
    ContainerFs._throwOnReadFailure(p, result);
    const encoding = ContainerFs._encodingOf(options);
    return encoding ? result.stdout.toString(encoding) : result.stdout;
  }

  static writeFileSync(p, data, options) {
    const at = ContainerFs._require(p, 'open');
    const input = ContainerFs._toBuffer(data, ContainerFs._encodingOf(options) || 'utf8');
    const result = DockerExec.sh(at.container, 'cat > "$1"', [at.posix], { input });
    if (result.status !== 0) throw ContainerFs._error('EIO', 'write', p, ContainerFs._failureDetail(result));
  }

  static mkdirSync(p, options) {
    const at = ContainerFs._require(p, 'mkdir');
    const argv = options && options.recursive ? ['mkdir', '-p', '--', at.posix] : ['mkdir', '--', at.posix];
    const result = DockerExec.exec(at.container, argv);
    if (result.status !== 0) throw ContainerFs._error('EIO', 'mkdir', p, result.stderr.trim());
  }

  static readdirSync(p, options) {
    const at = ContainerFs._require(p, 'scandir');
    const entries = ContainerFs.list(at.container, at.posix, p);
    if (options && options.withFileTypes) return entries.map((entry) => ContainerFs._dirent(entry.type, entry.name));
    return entries.map((entry) => entry.name);
  }

  static rmSync(p, options) {
    const at = ContainerFs._require(p, 'rm');
    if (at.posix === '/') throw ContainerFs._error('EPERM', 'rm', p, 'refusing to remove the container root');
    const result = DockerExec.exec(at.container, ContainerFs._rmArgv(at.posix, options));
    if (result.status !== 0) throw ContainerFs._error('EIO', 'rm', p, result.stderr.trim());
  }

  static list(container, posix, verbPath) {
    const result = DockerExec.sh(container, ContainerFs.LIST_SCRIPT, [posix]);
    if (result.status !== 0) throw ContainerFs._listError(verbPath || posix, result);
    return ContainerFs._parseListing(result.stdout.toString('utf8'));
  }

  static _require(p, verb) {
    const at = ContainerPath.parse(p);
    if (!at) throw ContainerFs._error('EINVAL', verb, p, 'not a container path');
    return at;
  }

  static _error(code, verb, p, detail) {
    const error = new Error(`${code}: ${detail || 'container filesystem error'}, ${verb} '${p}'`);
    error.code = code;
    error.path = p;
    return error;
  }

  static _failureDetail(result) {
    return result.stderr.trim() || String(result.error && result.error.message);
  }

  static _statError(p, result) {
    if (result.status === null) return ContainerFs._error('EIO', 'stat', p, String(result.error && result.error.message));
    return ContainerFs._error('ENOENT', 'stat', p, 'no such file or directory');
  }

  static _throwOnReadFailure(p, result) {
    if (result.status === ContainerFs.EXIT_IS_DIRECTORY) throw ContainerFs._error('EISDIR', 'read', p, 'illegal operation on a directory');
    if (result.status === ContainerFs.EXIT_MISSING) throw ContainerFs._error('ENOENT', 'open', p, 'no such file or directory');
    if (result.status !== 0) throw ContainerFs._error('EIO', 'read', p, ContainerFs._failureDetail(result));
  }

  static _listError(p, result) {
    const code = result.status === ContainerFs.EXIT_MISSING ? 'ENOENT' : 'EIO';
    return ContainerFs._error(code, 'scandir', p, result.stderr.trim() || 'no such directory');
  }

  static _parseListing(text) {
    const entries = [];
    for (const line of text.split('\n')) {
      const match = /^([df]) (\d+) (.+)$/.exec(line);
      if (match) entries.push({ type: match[1], bytes: Number(match[2]), name: match[3] });
    }
    return entries;
  }

  static _encodingOf(options) {
    return typeof options === 'string' ? options : options && options.encoding;
  }

  static _toBuffer(data, encoding) {
    return Buffer.isBuffer(data) ? data : Buffer.from(String(data == null ? '' : data), encoding);
  }

  static _rmArgv(posix, options) {
    const flags = `-${options && options.recursive ? 'r' : ''}${options && options.force ? 'f' : ''}`;
    return flags === '-' ? ['rm', '--', posix] : ['rm', flags, '--', posix];
  }

  static _makeStat(kind, size, mtimeSec, mode) {
    const mtimeMs = Number(mtimeSec) * 1000 || 0;
    return {
      size: Number(size) || 0,
      mtimeMs,
      ctimeMs: mtimeMs,
      mtime: new Date(mtimeMs),
      mode: parseInt(mode, 8) || 0,
      dev: 0,
      ino: 0,
      isDirectory: () => kind === 'directory',
      isFile: () => /regular/.test(kind),
      isSymbolicLink: () => false,
    };
  }

  static _dirent(type, name) {
    return {
      name,
      isDirectory: () => type === 'd',
      isFile: () => type === 'f',
      isSymbolicLink: () => false,
    };
  }
}

module.exports = ContainerFs;
