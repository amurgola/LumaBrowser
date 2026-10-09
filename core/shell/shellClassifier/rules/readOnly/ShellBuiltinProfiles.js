const ProfileGroup = require('./ProfileGroup');
const UtilityProfile = require('./UtilityProfile');
const PredicateProfile = require('./PredicateProfile');
const OptionGrammar = require('./OptionGrammar');
const OptionHazard = require('./OptionHazard');

class ShellBuiltinProfiles extends ProfileGroup {
  static DEFINES = 'with a name defines or changes it';

  static NAVIGATION = UtilityProfile.plain(['cd', 'jobs', 'times', 'wait'], 'only changes or reports shell session state');

  static READ = UtilityProfile.plain(['read'], 'reads a line into a shell variable');

  static ALIAS = new PredicateProfile(['alias'], (args) => !args.some((word) => word.includes('=')), {
    reads: 'lists aliases',
    refuses: 'with name=value defines an alias',
  });

  static LISTING_ONLY = new UtilityProfile({
    names: ['declare', 'typeset', 'export'],
    summary: 'lists variables',
    maxOperands: { count: 0, why: ShellBuiltinProfiles.DEFINES },
  });

  static SET = new PredicateProfile(['set'], (args) => ShellBuiltinProfiles._onlyTogglesOptions(args), {
    reads: 'lists or toggles shell options',
    refuses: 'with operands replaces the positional parameters',
  });

  static HISTORY = new UtilityProfile({
    names: ['history'],
    summary: 'lists command history',
    grammar: new OptionGrammar({ valueShort: 'd' }),
    hazards: [new OptionHazard({ effect: OptionHazard.WRITES, short: 'acdw', why: 'clears, deletes or writes history' })],
  });

  static ULIMIT = new PredicateProfile(['ulimit'], (args) => !args.some((word) => /^\d+$/.test(word) || word === 'unlimited'), {
    reads: 'prints resource limits',
    refuses: 'with a value sets a resource limit',
  });

  static UMASK = new UtilityProfile({
    names: ['umask'],
    summary: 'prints the file creation mask',
    maxOperands: { count: 0, why: 'with a mask operand changes it' },
  });

  static REMOVERS = PredicateProfile.never(['local', 'unset'], 'defines or removes shell variables');

  static profiles() {
    return [ShellBuiltinProfiles.NAVIGATION, ShellBuiltinProfiles.READ, ShellBuiltinProfiles.ALIAS, ShellBuiltinProfiles.LISTING_ONLY,
      ShellBuiltinProfiles.SET, ShellBuiltinProfiles.HISTORY, ShellBuiltinProfiles.ULIMIT, ShellBuiltinProfiles.UMASK, ShellBuiltinProfiles.REMOVERS];
  }

  static _onlyTogglesOptions(args) {
    for (let i = 0; i < args.length; i++) {
      if (!/^[-+][a-zA-Z]+$/.test(args[i])) return false;
      if (args[i].endsWith('o')) i++;
    }
    return true;
  }
}

module.exports = ShellBuiltinProfiles;
