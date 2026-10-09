const ProfileGroup = require('./ProfileGroup');
const UtilityProfile = require('./UtilityProfile');
const OptionGrammar = require('./OptionGrammar');
const OptionHazard = require('./OptionHazard');
const SharedHazards = require('./SharedHazards');

class SearchToolProfiles extends ProfileGroup {
  static FIND = new UtilityProfile({
    names: ['find'],
    summary: 'lists matching files',
    grammar: new OptionGrammar({ style: OptionGrammar.WORDS }),
    hazards: [
      new OptionHazard({ effect: OptionHazard.EXECUTES, words: ['-exec', '-execdir', '-ok', '-okdir'], why: 'runs a command for each match' }),
      new OptionHazard({ effect: OptionHazard.WRITES, words: ['-delete'], why: 'deletes each match' }),
      new OptionHazard({ effect: OptionHazard.WRITES, words: ['-fls', '-fprint', '-fprint0', '-fprintf'], why: 'writes its listing to a file' }),
    ],
  });

  static RIPGREP = new UtilityProfile({
    names: ['rg'],
    summary: 'searches file contents',
    grammar: new OptionGrammar({
      valueShort: 'ABCEMTdefgjmrt',
      valueLong: ['after-context', 'before-context', 'context', 'encoding', 'file', 'glob', 'iglob', 'max-count', 'max-depth',
        'pre', 'pre-glob', 'regexp', 'replace', 'threads', 'type', 'type-not', 'hostname-bin', 'max-columns'],
    }),
    hazards: [
      new OptionHazard({ effect: OptionHazard.EXECUTES, long: ['pre'], why: 'runs a preprocessor program on every file' }),
      new OptionHazard({ effect: OptionHazard.EXECUTES, short: 'z', long: ['search-zip'], why: 'runs decompression programs on compressed files' }),
      new OptionHazard({ effect: OptionHazard.EXECUTES, long: ['hostname-bin'], why: 'runs the given program to find the host name' }),
    ],
  });

  static FD = new UtilityProfile({
    names: ['fd', 'fdfind'],
    summary: 'lists matching files',
    grammar: new OptionGrammar({ valueShort: 'EScdejtxX', valueLong: ['exclude', 'extension', 'type', 'max-depth', 'size', 'exec', 'exec-batch'] }),
    hazards: [
      new OptionHazard({ effect: OptionHazard.EXECUTES, short: 'x', long: ['exec'], why: 'runs a command for each match' }),
      new OptionHazard({ effect: OptionHazard.EXECUTES, short: 'X', long: ['exec-batch'], why: 'runs a command over all matches' }),
    ],
  });

  static SILVER_SEARCHER = new UtilityProfile({
    names: ['ag'],
    summary: 'searches file contents',
    grammar: new OptionGrammar({ valueShort: 'ABCGgmpW', valueLong: ['pager', 'ignore', 'file-search-regex'] }),
    hazards: [SharedHazards.PAGER_PROGRAM],
  });

  static profiles() {
    return [SearchToolProfiles.FIND, SearchToolProfiles.RIPGREP, SearchToolProfiles.FD, SearchToolProfiles.SILVER_SEARCHER];
  }
}

module.exports = SearchToolProfiles;
