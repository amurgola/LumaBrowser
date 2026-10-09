const ProfileGroup = require('./ProfileGroup');
const UtilityProfile = require('./UtilityProfile');
const OptionGrammar = require('./OptionGrammar');
const OptionHazard = require('./OptionHazard');
const SharedHazards = require('./SharedHazards');

class ViewerProfiles extends ProfileGroup {
  static LESS = new UtilityProfile({
    names: ['less'],
    summary: 'pages through files',
    grammar: new OptionGrammar({ valueShort: 'OPTbhjkopxyz', valueLong: ['log-file', 'LOG-FILE', 'prompt', 'tag-file'] }),
    hazards: [new OptionHazard({ effect: OptionHazard.WRITES, short: 'oO', long: ['log-file', 'LOG-FILE'], why: 'copies its input to a log file' })],
  });

  static MAN = new UtilityProfile({
    names: ['man'],
    summary: 'shows a manual page',
    grammar: new OptionGrammar({ valueShort: 'CELMPRSemp', valueLong: ['config-file', 'manpath', 'pager', 'sections', 'encoding', 'locale'], abbreviatesLong: true }),
    hazards: [
      new OptionHazard({ effect: OptionHazard.EXECUTES, short: 'P', long: ['pager'], why: 'runs the given program as a pager' }),
      new OptionHazard({ effect: OptionHazard.EXECUTES, short: 'HX', long: ['html', 'gxditview'], why: 'runs a browser or viewer program' }),
    ],
  });

  static INFO = new UtilityProfile({
    names: ['info'],
    summary: 'shows an info manual',
    grammar: new OptionGrammar({ valueShort: 'dfno', valueLong: ['directory', 'file', 'node', 'output'], abbreviatesLong: true }),
    hazards: [SharedHazards.OUTPUT_FILE],
  });

  static TLDR = new UtilityProfile({
    names: ['tldr'],
    summary: 'shows a cached cheat sheet',
    hazards: [new OptionHazard({ effect: OptionHazard.WRITES, short: 'u', long: ['update', 'clear-cache'], why: 'downloads or clears its page cache' })],
  });

  static BAT = new UtilityProfile({
    names: ['bat', 'batcat'],
    summary: 'prints files with highlighting',
    grammar: new OptionGrammar({ valueShort: 'HlmrL', valueLong: ['language', 'highlight-line', 'line-range', 'map-syntax', 'pager', 'theme', 'style', 'tabs', 'wrap'] }),
    hazards: [SharedHazards.PAGER_PROGRAM],
    inspect: (scanned) => (scanned.operands[0] === 'cache' ? 'cache rebuilds or clears its theme and syntax cache' : null),
  });

  static TREE = new UtilityProfile({
    names: ['tree'],
    summary: 'prints a directory tree',
    grammar: new OptionGrammar({ valueShort: 'HILPTo', valueLong: ['charset', 'filelimit', 'timefmt', 'sort', 'hintro', 'houtro'] }),
    hazards: [
      SharedHazards.OUTPUT_FILE,
      new OptionHazard({ effect: OptionHazard.WRITES, short: 'R', why: 'writes an HTML listing into every directory' }),
    ],
  });

  static FILE = new UtilityProfile({
    names: ['file'],
    summary: 'reports file types',
    grammar: new OptionGrammar({ valueShort: 'FPefm', valueLong: ['exclude', 'files-from', 'magic-file', 'separator', 'parameter'], abbreviatesLong: true }),
    hazards: [new OptionHazard({ effect: OptionHazard.WRITES, short: 'C', long: ['compile'], why: 'compiles a magic file to disk' })],
  });

  static XXD = new UtilityProfile({
    names: ['xxd'],
    summary: 'prints a hex dump',
    grammar: new OptionGrammar({
      style: OptionGrammar.WORDS,
      valueWords: ['-c', '-cols', '-g', '-groupsize', '-l', '-len', '-n', '-name', '-o', '-offset', '-s', '-seek', '-R'],
    }),
    maxOperands: { count: 1, why: 'writes its second operand as the output file' },
  });

  static BASE_ENCODERS = new UtilityProfile({
    names: ['base32', 'base64'],
    summary: 'prints encoded or decoded data',
    grammar: new OptionGrammar({ valueShort: 'biow', valueLong: ['break', 'input', 'output', 'wrap'], abbreviatesLong: true }),
    hazards: [SharedHazards.OUTPUT_FILE],
  });

  static profiles() {
    return [ViewerProfiles.LESS, ViewerProfiles.MAN, ViewerProfiles.INFO, ViewerProfiles.TLDR, ViewerProfiles.BAT,
      ViewerProfiles.TREE, ViewerProfiles.FILE, ViewerProfiles.XXD, ViewerProfiles.BASE_ENCODERS];
  }
}

module.exports = ViewerProfiles;
