const ReadOnlyCatalog = require('./ReadOnlyCatalog');
const UtilityProfile = require('./UtilityProfile');
const PredicateProfile = require('./PredicateProfile');
const OptionGrammar = require('./OptionGrammar');
const OptionHazard = require('./OptionHazard');
const SystemQueryProfiles = require('./SystemQueryProfiles');

class CmdBuiltinCatalog extends ReadOnlyCatalog {
  static GRAMMAR = new OptionGrammar({ style: OptionGrammar.SLASH });

  static PLAIN = ['::', 'cls', 'clear', 'comp', 'dir', 'driverquery', 'echo', 'echo.', 'exit', 'fc', 'find', 'findstr', 'getmac', 'hostname',
    'more', 'netstat', 'nslookup', 'pathping', 'pause', 'prompt', 'rem', 'systeminfo', 'title', 'tracert', 'tree', 'type', 'ver', 'vol',
    'where', 'whoami'];

  static IPCONFIG = CmdBuiltinCatalog._guarded(['ipconfig'], 'shows network configuration', [new OptionHazard({
    effect: OptionHazard.CHANGES_SYSTEM,
    words: ['/flushdns', '/registerdns', '/release', '/release6', '/renew', '/renew6', '/setclassid', '/setclassid6'],
    why: 'changes network configuration',
  })]);

  static GPRESULT = CmdBuiltinCatalog._guarded(['gpresult'], 'reports group policy', [
    new OptionHazard({ effect: OptionHazard.WRITES, words: ['/h', '/x'], why: 'writes a report file' }),
  ]);

  static MSINFO32 = CmdBuiltinCatalog._guarded(['msinfo32'], 'shows system information', [
    new OptionHazard({ effect: OptionHazard.WRITES, words: ['/nfo', '/report'], why: 'writes a report file' }),
  ]);

  static PING = CmdBuiltinCatalog._guarded(['ping'], 'sends a bounded number of echo requests', [
    new OptionHazard({ effect: OptionHazard.BLOCKS, words: ['/t'], why: 'pings until stopped' }),
  ]);

  static SORT = CmdBuiltinCatalog._guarded(['sort'], 'prints its input sorted', [
    new OptionHazard({ effect: OptionHazard.WRITES, words: ['/o', '/output'], why: 'writes its result to a file' }),
  ]);

  static CLOCK = new UtilityProfile({
    names: ['date', 'time'],
    summary: 'prints the clock',
    grammar: CmdBuiltinCatalog.GRAMMAR,
    maxOperands: { count: 0, why: 'with an operand changes the system time' },
  });

  static SET = new PredicateProfile(['set'], (args) => !args.some((word) => word.includes('=')), {
    reads: 'lists environment variables',
    refuses: 'with name=value defines a variable',
  });

  static NO_ARGUMENT_READERS = new PredicateProfile(['chcp', 'label', 'path'], (args) => args.length === 0, {
    reads: 'prints its current setting',
    refuses: 'with an argument changes the setting',
  });

  constructor() {
    super([
      UtilityProfile.plain(CmdBuiltinCatalog.PLAIN, 'only reports or prints'),
      CmdBuiltinCatalog.IPCONFIG, CmdBuiltinCatalog.GPRESULT, CmdBuiltinCatalog.MSINFO32, CmdBuiltinCatalog.PING, CmdBuiltinCatalog.SORT,
      CmdBuiltinCatalog.CLOCK, CmdBuiltinCatalog.SET, CmdBuiltinCatalog.NO_ARGUMENT_READERS, SystemQueryProfiles.NVIDIA_SMI,
    ]);
  }

  static _guarded(names, summary, hazards) {
    return new UtilityProfile({ names, summary, grammar: CmdBuiltinCatalog.GRAMMAR, hazards });
  }
}

module.exports = CmdBuiltinCatalog;
