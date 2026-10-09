const ProfileGroup = require('./ProfileGroup');
const UtilityProfile = require('./UtilityProfile');
const PredicateProfile = require('./PredicateProfile');
const OptionGrammar = require('./OptionGrammar');
const OptionHazard = require('./OptionHazard');

class SystemQueryProfiles extends ProfileGroup {
  static CHANGES_CLOCK = 'changes the system time';

  static DATE = new UtilityProfile({
    names: ['date'],
    summary: 'prints the date',
    grammar: new OptionGrammar({ valueShort: 'dfrs', valueLong: ['date', 'file', 'reference', 'set'], abbreviatesLong: true }),
    hazards: [new OptionHazard({ effect: OptionHazard.CHANGES_SYSTEM, short: 's', long: ['set'], why: SystemQueryProfiles.CHANGES_CLOCK })],
    inspect: (scanned) => (scanned.operands.some((word) => !word.startsWith('+')) ? `with a time operand ${SystemQueryProfiles.CHANGES_CLOCK}` : null),
  });

  static HOSTNAME = new UtilityProfile({
    names: ['hostname'],
    summary: 'prints the host name',
    grammar: new OptionGrammar({ valueShort: 'F', valueLong: ['file'], abbreviatesLong: true }),
    hazards: [new OptionHazard({ effect: OptionHazard.CHANGES_SYSTEM, short: 'Fb', long: ['file', 'boot'], why: 'sets the host name' })],
    maxOperands: { count: 0, why: 'with a name operand sets the host name' },
  });

  static SYSCTL = new UtilityProfile({
    names: ['sysctl'],
    summary: 'prints kernel parameters',
    grammar: new OptionGrammar({ valueShort: 'p', valueLong: ['load', 'pattern'], abbreviatesLong: true }),
    hazards: [new OptionHazard({ effect: OptionHazard.CHANGES_SYSTEM, short: 'fpw', long: ['load', 'system', 'write'], why: 'sets kernel parameters' })],
    inspect: (scanned) => (scanned.operands.some((word) => word.includes('=')) ? 'name=value sets a kernel parameter' : null),
  });

  static NVIDIA_SMI = new UtilityProfile({
    names: ['nvidia-smi'],
    summary: 'reports GPU state',
    grammar: new OptionGrammar({ style: OptionGrammar.WORDS, valueWords: ['-i', '--id', '-d', '-l', '-lms', '-f'] }),
    hazards: [
      new OptionHazard({
        effect: OptionHazard.CHANGES_SYSTEM,
        words: ['-ac', '-am', '-c', '-caa', '-dm', '-e', '-fdm', '-lgc', '-lmc', '-mig', '-p', '-pl', '-pm', '-r', '-rac', '-rgc', '-rmc'],
        long: ['accounting-mode', 'applications-clocks', 'clear-accounted-apps', 'compute-mode', 'driver-model', 'ecc-config',
          'force-driver-model', 'gpu-reset', 'lock-gpu-clocks', 'lock-memory-clocks', 'multi-instance-gpu', 'persistence-mode',
          'power-limit', 'reset-applications-clocks', 'reset-ecc-errors', 'reset-gpu-clocks', 'reset-memory-clocks'],
        why: 'changes GPU settings',
      }),
      new OptionHazard({ effect: OptionHazard.WRITES, words: ['-f'], long: ['filename'], why: 'writes its report to a file' }),
    ],
  });

  static SAR = new UtilityProfile({
    names: ['sar'],
    summary: 'reports activity counters',
    grammar: new OptionGrammar({ valueShort: 'IPefimnos' }),
    hazards: [new OptionHazard({ effect: OptionHazard.WRITES, short: 'o', why: 'saves samples to a file' })],
  });

  static STTY_QUERIES = new Set(['-a', '--all', '-g', '--save', 'size', 'speed']);

  static STTY = new PredicateProfile(['stty'], (args) => args.every((word) => SystemQueryProfiles.STTY_QUERIES.has(word)), {
    reads: 'prints terminal settings',
    refuses: 'with settings changes the terminal',
  });

  static TOP = new UtilityProfile({
    names: ['top'],
    summary: 'prints a process snapshot',
    grammar: new OptionGrammar({ valueShort: 'dlnopsuU' }),
    requires: { test: (scanned) => ['b', 'l', 'n'].some((letter) => scanned.hasOption(letter, null)), why: 'is interactive without batch mode (-b) or a count (-n, -l)' },
  });

  static RPM = new PredicateProfile(['rpm'], (args) => args.some((word) => /^-q/.test(word) || word === '--query'), {
    reads: 'queries the package database',
    refuses: 'only reads in query mode (-q)',
  });

  static LDCONFIG = new PredicateProfile(['ldconfig'], (args) => args.includes('-p') || args.includes('--print-cache'), {
    reads: 'prints the library cache',
    refuses: 'rebuilds the library cache unless printing it (-p)',
  });

  static ENV = new UtilityProfile({
    names: ['env'],
    summary: 'prints the environment',
    grammar: new OptionGrammar({ valueShort: 'CSu', valueLong: ['chdir', 'split-string', 'unset'], abbreviatesLong: true }),
    hazards: [new OptionHazard({ effect: OptionHazard.EXECUTES, short: 'S', long: ['split-string'], why: 'runs a command line' })],
    inspect: (scanned) => (scanned.operands.some((word) => !word.includes('=')) ? 'runs a command' : null),
  });

  static XCLIP = new PredicateProfile(['xclip'], (args) => args.includes('-o') || args.includes('-out'), {
    reads: 'prints the clipboard',
    refuses: 'writes the clipboard unless printing it (-o)',
  });

  static XSEL = new PredicateProfile(['xsel'], (args) => args.includes('-o') || args.includes('--output'), {
    reads: 'prints the selection',
    refuses: 'writes the selection unless printing it (-o)',
  });

  static PBCOPY = PredicateProfile.never(['pbcopy'], 'writes the clipboard');

  static profiles() {
    return [SystemQueryProfiles.DATE, SystemQueryProfiles.HOSTNAME, SystemQueryProfiles.SYSCTL, SystemQueryProfiles.NVIDIA_SMI,
      SystemQueryProfiles.SAR, SystemQueryProfiles.STTY, SystemQueryProfiles.TOP, SystemQueryProfiles.RPM, SystemQueryProfiles.LDCONFIG,
      SystemQueryProfiles.ENV, SystemQueryProfiles.XCLIP, SystemQueryProfiles.XSEL, SystemQueryProfiles.PBCOPY];
  }
}

module.exports = SystemQueryProfiles;
