const OptionHazard = require('./OptionHazard');

class SharedHazards {
  static OUTPUT_FILE = new OptionHazard({ effect: OptionHazard.WRITES, short: 'o', long: ['output'], why: 'writes its result to a file' });

  static PAGER_PROGRAM = new OptionHazard({ effect: OptionHazard.EXECUTES, long: ['pager'], why: 'runs the given program as a pager' });

  static POWERSHELL_FILE_OUTPUT = new OptionHazard({
    effect: OptionHazard.WRITES,
    params: ['outfile', 'outputpath', 'outputdirectory', 'destinationpath', 'logpath'],
    why: 'writes a file',
  });

  static POWERSHELL_BROWSER = new OptionHazard({ effect: OptionHazard.SENDS, params: ['online', 'usebrowser'], why: 'opens a web browser' });

  static POWERSHELL_REPAIR = new OptionHazard({ effect: OptionHazard.CHANGES_SYSTEM, params: ['repair'], why: 'repairs, which changes system state' });

  static POWERSHELL_COMMON = Object.freeze([SharedHazards.POWERSHELL_FILE_OUTPUT, SharedHazards.POWERSHELL_BROWSER, SharedHazards.POWERSHELL_REPAIR]);
}

module.exports = SharedHazards;
