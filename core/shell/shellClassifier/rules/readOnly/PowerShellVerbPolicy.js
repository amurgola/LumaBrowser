const UtilityProfile = require('./UtilityProfile');
const OptionGrammar = require('./OptionGrammar');
const SharedHazards = require('./SharedHazards');
const ReadOnlyVerdict = require('./ReadOnlyVerdict');

class PowerShellVerbPolicy {
  static READ_VERBS = new Set(['compare', 'convertfrom', 'convertto', 'format', 'get', 'measure', 'resolve', 'search', 'select', 'show', 'test', 'trace']);

  static CMDLET_NAME = /^([a-z]+)-[a-z]/;

  static EXCEPTIONS = new Map([
    ['format-volume', 'formats a volume, erasing it'],
    ['get-credential', 'prompts for a secret'],
    ['test-credential', 'checks a secret'],
    ['get-windowsupdatelog', 'writes a merged log file to disk'],
    ['measure-command', 'runs its script block'],
    ['trace-command', 'runs its expression and can log to a file'],
  ]);

  static TRUSTED = new UtilityProfile({
    names: ['read-verb cmdlet'],
    summary: 'uses a read-only verb',
    grammar: new OptionGrammar({ style: OptionGrammar.POWERSHELL }),
    hazards: SharedHazards.POWERSHELL_COMMON,
  });

  static judge(name, args) {
    if (!PowerShellVerbPolicy.hasReadVerb(name)) return null;
    if (PowerShellVerbPolicy.EXCEPTIONS.has(name)) return ReadOnlyVerdict.refuses(`${name} ${PowerShellVerbPolicy.EXCEPTIONS.get(name)}.`);
    return PowerShellVerbPolicy.TRUSTED.judge(name, args);
  }

  static hasReadVerb(name) {
    const match = PowerShellVerbPolicy.CMDLET_NAME.exec(name);
    return !!match && PowerShellVerbPolicy.READ_VERBS.has(match[1]);
  }
}

module.exports = PowerShellVerbPolicy;
