const ProfileGroup = require('./ProfileGroup');
const UtilityProfile = require('./UtilityProfile');
const OptionGrammar = require('./OptionGrammar');
const OptionHazard = require('./OptionHazard');
const SharedHazards = require('./SharedHazards');
const SedScript = require('./SedScript');
const AwkProgram = require('./AwkProgram');

class StreamEditorProfiles extends ProfileGroup {
  static UNREADABLE_PROGRAM_FILE = 'reads its program from a file this rule cannot inspect';

  static SED = new UtilityProfile({
    names: ['sed'],
    summary: 'prints an edited copy of its input',
    grammar: new OptionGrammar({ valueShort: 'efl', valueLong: ['expression', 'file', 'line-length'], abbreviatesLong: true }),
    hazards: [
      new OptionHazard({ effect: OptionHazard.WRITES, short: 'i', long: ['in-place'], why: 'edits files in place' }),
      new OptionHazard({ effect: OptionHazard.UNVERIFIABLE, short: 'f', long: ['file'], why: StreamEditorProfiles.UNREADABLE_PROGRAM_FILE }),
    ],
    inspect: (scanned) => StreamEditorProfiles._sedScriptHazard(scanned),
  });

  static AWK = new UtilityProfile({
    names: ['awk', 'gawk', 'mawk', 'nawk'],
    summary: 'prints fields computed from its input',
    grammar: new OptionGrammar({
      valueShort: 'EFWefilv',
      valueLong: ['exec', 'field-separator', 'file', 'include', 'load', 'source', 'assign'],
      abbreviatesLong: true,
    }),
    hazards: [
      new OptionHazard({ effect: OptionHazard.UNVERIFIABLE, short: 'fE', long: ['file', 'exec'], why: StreamEditorProfiles.UNREADABLE_PROGRAM_FILE }),
      new OptionHazard({ effect: OptionHazard.UNVERIFIABLE, short: 'i', long: ['include'], why: 'includes an awk source file this rule cannot inspect' }),
      new OptionHazard({ effect: OptionHazard.EXECUTES, short: 'l', long: ['load'], why: 'loads a compiled extension' }),
      new OptionHazard({ effect: OptionHazard.WRITES, short: 'opd', long: ['pretty-print', 'profile', 'dump-variables'], why: 'writes a report file' }),
      new OptionHazard({ effect: OptionHazard.UNVERIFIABLE, short: 'W', when: (value) => /^e/i.test(value || ''), why: 'exec reads its program from a file this rule cannot inspect' }),
    ],
    inspect: (scanned) => AwkProgram.hazardIn(StreamEditorProfiles._programText(scanned, 'e', 'source')),
  });

  static SORT = new UtilityProfile({
    names: ['sort'],
    summary: 'prints its input sorted',
    grammar: new OptionGrammar({
      valueShort: 'STkot',
      valueLong: ['batch-size', 'buffer-size', 'compress-program', 'field-separator', 'files0-from', 'key', 'output', 'parallel', 'random-source', 'sort', 'temporary-directory'],
      abbreviatesLong: true,
    }),
    hazards: [
      SharedHazards.OUTPUT_FILE,
      new OptionHazard({ effect: OptionHazard.EXECUTES, long: ['compress-program'], why: 'runs the given program to compress temporary files' }),
    ],
  });

  static UNIQ = new UtilityProfile({
    names: ['uniq'],
    summary: 'prints its input without repeated lines',
    grammar: new OptionGrammar({ valueShort: 'fsw', valueLong: ['skip-fields', 'skip-chars', 'check-chars'], abbreviatesLong: true }),
    maxOperands: { count: 1, why: 'writes its second operand as the output file' },
  });

  static YQ = new UtilityProfile({
    names: ['yq'],
    summary: 'prints queried YAML, JSON or XML',
    grammar: new OptionGrammar({ valueShort: 'IOops', valueLong: ['indent', 'input-format', 'output-format', 'split-exp'] }),
    hazards: [
      new OptionHazard({ effect: OptionHazard.WRITES, short: 'i', long: ['inplace', 'in-place'], why: 'edits files in place' }),
      new OptionHazard({ effect: OptionHazard.WRITES, short: 's', long: ['split-exp'], why: 'writes each document to its own file' }),
    ],
  });

  static profiles() {
    return [StreamEditorProfiles.SED, StreamEditorProfiles.AWK, StreamEditorProfiles.SORT, StreamEditorProfiles.UNIQ, StreamEditorProfiles.YQ];
  }

  static _sedScriptHazard(scanned) {
    const scripts = scanned.valuesOf('e', 'expression');
    const pieces = scripts.length ? scripts : scanned.operands.slice(0, 1);
    for (const piece of pieces) {
      const hazard = SedScript.hazardIn(piece);
      if (hazard) return hazard;
    }
    return null;
  }

  static _programText(scanned, short, long) {
    const sources = scanned.valuesOf(short, long);
    return sources.length ? sources.join('\n') : (scanned.operands[0] || '');
  }
}

module.exports = StreamEditorProfiles;
