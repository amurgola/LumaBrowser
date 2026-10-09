const ProfileGroup = require('./ProfileGroup');
const UtilityProfile = require('./UtilityProfile');
const OptionGrammar = require('./OptionGrammar');
const OptionHazard = require('./OptionHazard');

class NetworkProfiles extends ProfileGroup {
  static SAFE_HTTP_METHODS = /^(get|head|options)$/i;

  static IP_CHANGE_VERBS = new Set(['add', 'append', 'change', 'del', 'delete', 'exec', 'flush', 'prepend', 'replace', 'set']);

  static CURL = new UtilityProfile({
    names: ['curl'],
    summary: 'fetches a URL to stdout',
    grammar: new OptionGrammar({
      valueShort: 'ACDEFHKPQTUXYbcdemortuwxyz',
      valueLong: ['config', 'cookie', 'cookie-jar', 'data', 'data-ascii', 'data-binary', 'data-raw', 'data-urlencode', 'dump-header',
        'form', 'form-string', 'header', 'json', 'max-time', 'output', 'output-dir', 'referer', 'request', 'stderr', 'trace',
        'trace-ascii', 'upload-file', 'user', 'user-agent', 'libcurl', 'etag-save', 'hsts', 'alt-svc', 'mail-rcpt', 'connect-timeout'],
    }),
    hazards: [
      new OptionHazard({
        effect: OptionHazard.WRITES,
        short: 'DOco',
        long: ['alt-svc', 'cookie-jar', 'dump-header', 'etag-save', 'hsts', 'libcurl', 'output', 'output-dir', 'remote-name',
          'remote-name-all', 'stderr', 'trace', 'trace-ascii'],
        why: 'writes a local file',
      }),
      new OptionHazard({
        effect: OptionHazard.SENDS,
        short: 'FTd',
        long: ['data', 'data-ascii', 'data-binary', 'data-raw', 'data-urlencode', 'form', 'form-string', 'json', 'mail-rcpt', 'upload-file'],
        why: 'sends data to the server',
      }),
      new OptionHazard({
        effect: OptionHazard.SENDS,
        short: 'X',
        long: ['request'],
        when: (method) => !NetworkProfiles.SAFE_HTTP_METHODS.test(method || ''),
        why: 'uses a request method that can change the server',
      }),
      new OptionHazard({ effect: OptionHazard.UNVERIFIABLE, short: 'K', long: ['config'], why: 'reads options from a file this rule cannot inspect' }),
    ],
  });

  static PING = new UtilityProfile({
    names: ['ping'],
    summary: 'sends a bounded number of echo requests',
    grammar: new OptionGrammar({ valueShort: 'IQSTWciltnswp' }),
    requires: { test: (scanned) => ['c', 'n', 'w'].some((letter) => scanned.hasOption(letter, null)), why: 'runs until stopped without a count (-c) or deadline (-w)' },
  });

  static SS = new UtilityProfile({
    names: ['ss'],
    summary: 'lists sockets',
    grammar: new OptionGrammar({ valueShort: 'AFNf', valueLong: ['query', 'socket', 'filter', 'family', 'net'] }),
    hazards: [new OptionHazard({ effect: OptionHazard.CHANGES_SYSTEM, short: 'K', long: ['kill'], why: 'forcibly closes the matching sockets' })],
  });

  static IFCONFIG = new UtilityProfile({
    names: ['ifconfig'],
    summary: 'shows network interfaces',
    maxOperands: { count: 1, why: 'reconfigures the interface when given settings' },
  });

  static IP = new UtilityProfile({
    names: ['ip'],
    summary: 'shows network configuration',
    grammar: new OptionGrammar({ style: OptionGrammar.WORDS, valueWords: ['-b', '-batch', '-f', '-family', '-n', '-netns', '-rc', '-rcvbuf', '-l', '-loops'] }),
    hazards: [new OptionHazard({ effect: OptionHazard.UNVERIFIABLE, words: ['-b', '-batch'], why: 'runs commands from a batch file this rule cannot inspect' })],
    inspect: (scanned) => {
      const verb = scanned.operands.find((word) => NetworkProfiles.IP_CHANGE_VERBS.has(word));
      return verb ? `${verb} changes network configuration or runs a command` : null;
    },
  });

  static profiles() {
    return [NetworkProfiles.CURL, NetworkProfiles.PING, NetworkProfiles.SS, NetworkProfiles.IFCONFIG, NetworkProfiles.IP];
  }
}

module.exports = NetworkProfiles;
