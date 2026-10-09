const ReadOnlyCatalog = require('./ReadOnlyCatalog');
const UtilityProfile = require('./UtilityProfile');
const PredicateProfile = require('./PredicateProfile');
const OptionGrammar = require('./OptionGrammar');
const OptionHazard = require('./OptionHazard');
const SharedHazards = require('./SharedHazards');
const PowerShellVerbPolicy = require('./PowerShellVerbPolicy');

class PowerShellCmdletCatalog extends ReadOnlyCatalog {
  static GRAMMAR = new OptionGrammar({ style: OptionGrammar.POWERSHELL });

  static FOLLOWS_FOREVER = new OptionHazard({ effect: OptionHazard.BLOCKS, params: ['wait'], why: 'keeps following the file and never exits' });

  static READ_VERB_ALIASES = ['compare', 'diff', 'dir', 'fc', 'fl', 'ft', 'fw', 'gal', 'gcb', 'gci', 'gcm', 'gdr', 'ghy', 'gi', 'gjb',
    'gl', 'gm', 'gmo', 'gp', 'gps', 'gpv', 'gsv', 'gu', 'gv', 'gwmi', 'h', 'help', 'history', 'ls', 'man', 'measure', 'ps', 'pwd',
    'rvpa', 'select', 'sls', 'tnc'];

  static PIPELINE_READERS = ['?', 'convert-path', 'echo', 'group', 'group-object', 'import-clixml', 'import-csv', 'ipcsv', 'join-path',
    'oh', 'out-host', 'out-null', 'out-string', 'read-host', 'sleep', 'sort', 'sort-object', 'split-path', 'start-sleep', 'where',
    'where-object', 'write', 'write-debug', 'write-error', 'write-host', 'write-information', 'write-output', 'write-verbose', 'write-warning'];

  static CONTENT_READERS = ['cat', 'gc', 'get-content', 'type'];

  constructor() {
    super([
      PowerShellCmdletCatalog._trusted(PowerShellCmdletCatalog.READ_VERB_ALIASES, 'is an alias of a read-only cmdlet'),
      PowerShellCmdletCatalog._trusted(PowerShellCmdletCatalog.PIPELINE_READERS, 'only filters, prints or parses'),
      PowerShellCmdletCatalog._trusted(PowerShellCmdletCatalog.CONTENT_READERS, 'reads file contents', [PowerShellCmdletCatalog.FOLLOWS_FOREVER]),
      PredicateProfile.never(['tee', 'tee-object'], 'writes its input to a file'),
      PredicateProfile.never(['%', 'foreach', 'foreach-object'], 'runs a script block for each item'),
    ]);
  }

  judge(name, args) {
    return super.judge(name, args) || PowerShellVerbPolicy.judge(name, args);
  }

  static _trusted(names, summary, extraHazards = []) {
    return new UtilityProfile({
      names,
      summary,
      grammar: PowerShellCmdletCatalog.GRAMMAR,
      hazards: [...SharedHazards.POWERSHELL_COMMON, ...extraHazards],
    });
  }
}

module.exports = PowerShellCmdletCatalog;
