const ProfileGroup = require('./ProfileGroup');
const UtilityProfile = require('./UtilityProfile');

class PlainReaderProfiles extends ProfileGroup {
  static GROUPS = Object.freeze([
    {
      summary: 'prints or filters text to stdout',
      names: ['cat', 'column', 'cut', 'egrep', 'expand', 'fgrep', 'fmt', 'fold', 'grep', 'head', 'join', 'look', 'more',
        'nl', 'numfmt', 'paste', 'pr', 'rev', 'tac', 'tail', 'tr', 'tsort', 'unexpand', 'wc'],
    },
    { summary: 'compares inputs and prints the differences', names: ['cmp', 'comm', 'diff', 'diff3'] },
    { summary: 'dumps bytes to stdout', names: ['hexdump', 'od', 'strings'] },
    {
      summary: 'prints checksums',
      names: ['b2sum', 'cksum', 'md5sum', 'sha1sum', 'sha224sum', 'sha256sum', 'sha384sum', 'sha512sum', 'shasum', 'sum'],
    },
    {
      summary: 'reports file names, paths and metadata',
      names: ['basename', 'df', 'dirname', 'du', 'exa', 'eza', 'ls', 'lsd', 'pwd', 'readlink', 'realpath', 'stat'],
    },
    { summary: 'reports users and sessions', names: ['groups', 'id', 'last', 'logname', 'tty', 'users', 'w', 'who', 'whoami'] },
    {
      summary: 'reports system and process state',
      names: ['arch', 'free', 'getconf', 'getent', 'iostat', 'locale', 'lsblk', 'lscpu', 'lsof', 'lspci', 'lsusb', 'mpstat',
        'nproc', 'pgrep', 'pidof', 'printenv', 'ps', 'sw_vers', 'system_profiler', 'uname', 'uptime', 'vm_stat', 'vmstat'],
    },
    { summary: 'looks up names and routes on the network', names: ['dig', 'host', 'netstat', 'nslookup', 'traceroute', 'tracert'] },
    { summary: 'inspects compiled binaries', names: ['ldd', 'nm', 'objdump', 'otool', 'readelf'] },
    { summary: 'computes or prints literal values', names: ['[', 'bc', 'cal', 'echo', 'expr', 'factor', 'false', 'printf', 'seq', 'sleep', 'test', 'true'] },
    { summary: 'queries package metadata', names: ['dpkg-query', 'pkg-config'] },
    { summary: 'prints structured data', names: ['jq'] },
    { summary: 'reads the clipboard', names: ['pbpaste'] },
    { summary: 'shows documentation or where a command lives', names: ['apropos', 'help', 'type', 'whatis', 'which'] },
  ]);

  static profiles() {
    return PlainReaderProfiles.GROUPS.map((group) => UtilityProfile.plain(group.names, group.summary));
  }
}

module.exports = PlainReaderProfiles;
