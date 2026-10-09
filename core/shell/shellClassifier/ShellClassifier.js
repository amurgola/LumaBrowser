const ShellDialect = require('./ShellDialect');
const ShellParser = require('./ShellParser');
const ShellRuleSet = require('./ShellRuleSet');
const RedirectTarget = require('./RedirectTarget');
const PrivilegeWrapper = require('./PrivilegeWrapper');
const ShellTier = require('./ShellTier');
const ShellCommandName = require('./ShellCommandName');
const CommandSubstitution = require('./CommandSubstitution');
const ShellWrapper = require('./ShellWrapper');
const PipeToShell = require('./PipeToShell');

class ShellClassifier {
  static MAX_DEPTH = 6;
  static LABEL_LIMIT = 80;
  static RAW_DISK_TARGET = /^\/dev\/(sd|hd|nvme|disk|mmcblk)|^\\\\\.\\physicaldrive/i;
  static ASSIGNMENT_OPERATORS = ['=', '+='];

  static classify(command, options = {}) {
    const wanted = String(options.dialect || 'auto').toLowerCase();
    if (wanted !== 'auto') return ShellClassifier._classifyIn(command, ShellDialect.normalize(wanted), 0);
    return ShellClassifier._classifyAuto(command, options.platform);
  }

  static _classifyAuto(command, platform) {
    const guessed = ShellDialect.guess(command, platform);
    let result = { ...ShellClassifier._classifyIn(command, guessed, 0), dialect: 'auto', guessedDialect: guessed };
    for (const dialect of ShellDialect.ALL) {
      if (dialect === guessed) continue;
      const alternative = ShellClassifier._classifyIn(command, dialect, 0);
      if (ShellClassifier._escalates(alternative.tier, result.tier)) {
        result = { ...alternative, dialect: 'auto', guessedDialect: guessed, reasons: ShellClassifier._dedupe([...alternative.reasons, ...result.reasons]) };
      }
    }
    return result;
  }

  static _escalates(tier, current) {
    return ShellTier.isAtLeast(tier, ShellTier.MASS_DESTRUCTIVE) && ShellTier.isWorse(tier, current);
  }

  static _classifyIn(command, dialect, depth) {
    const source = String(command == null ? '' : command);
    if (!source.trim()) return { tier: ShellTier.READONLY, reasons: [], commands: [], dialect };
    if (depth > ShellClassifier.MAX_DEPTH) return { tier: ShellTier.NORMAL, reasons: ['Nested too deeply to inspect.'], commands: [], dialect };
    if (ShellClassifier._isForkBomb(source)) return { tier: ShellTier.FORBIDDEN, reasons: ['That is a fork bomb.'], commands: [], dialect };
    const verdicts = ShellClassifier._verdictsFor(ShellParser.parseLine(source, { dialect }), dialect, depth);
    return { tier: ShellClassifier._worstOf(verdicts), reasons: ShellClassifier._reasonsWorstFirst(verdicts), commands: verdicts, dialect };
  }

  static _isForkBomb(source) {
    if (/:\s*\(\s*\)\s*\{\s*:\s*\|\s*:\s*&\s*\}\s*;?\s*:/.test(source)) return true;
    return /\bwhile\s+true\s*;?\s*do\s+.*&\s*done/.test(source) && /\$0|fork/.test(source);
  }

  static _verdictsFor(commands, dialect, depth) {
    return commands.flatMap((command, i) => ShellClassifier._classifyOne(command, dialect, depth, commands[i - 1]));
  }

  static _worstOf(verdicts) {
    return verdicts.reduce((tier, verdict) => ShellTier.worst(tier, verdict.tier), ShellTier.READONLY);
  }

  static _reasonsWorstFirst(verdicts) {
    return ShellClassifier._dedupe(ShellTier.sortWorstFirst(verdicts).map((verdict) => verdict.reason));
  }

  static _dedupe(list) {
    return [...new Set(list.filter(Boolean))];
  }

  static _classifyOne(command, dialect, depth, previous) {
    if (!command.name) return ShellClassifier._assignmentsOnly(command, dialect, depth);
    if (dialect !== ShellDialect.POSIX && /^\$/.test(command.name)) return ShellClassifier._powerShellExpression(command, dialect, depth);
    return ShellClassifier._simpleCommand(command, dialect, depth, previous);
  }

  static _assignmentsOnly(command, dialect, depth) {
    const inner = CommandSubstitution.extractAll(command.assignments.map((assignment) => assignment.value), { dialect });
    if (!inner.length) return [ShellClassifier._verdict(null, [], ShellTier.READONLY, null)];
    return ShellClassifier._substitutionVerdicts(inner, dialect, depth);
  }

  static _powerShellExpression(command, dialect, depth) {
    const readonly = [ShellClassifier._verdict(command.name, command.args, ShellTier.READONLY, null)];
    if (ShellClassifier.ASSIGNMENT_OPERATORS.includes(command.args[0])) {
      const rhs = command.args.slice(1).join(' ');
      return rhs.trim() ? [ShellClassifier._summarize(ShellClassifier._classifyIn(rhs, dialect, depth + 1), rhs)] : readonly;
    }
    const inner = CommandSubstitution.extractAll([command.name, ...command.args], { dialect });
    return inner.length ? ShellClassifier._substitutionVerdicts(inner, dialect, depth) : readonly;
  }

  static _simpleCommand(command, dialect, depth, previous) {
    const name = ShellCommandName.base(command.name);
    const substitutions = ShellClassifier._substitutionVerdicts(CommandSubstitution.extractAll([command.name, ...command.args], { dialect }), dialect, depth);
    const lead = ShellClassifier._pipeVerdict(command, name, previous)
      || ShellClassifier._wrapperVerdict(command, name, dialect, depth)
      || ShellClassifier._ruleVerdict(command, name, dialect);
    return [lead, ...substitutions];
  }

  static _substitutionVerdicts(lines, dialect, depth) {
    return lines.map((line) => ShellClassifier._summarize(ShellClassifier._classifyIn(line, dialect, depth + 1), line));
  }

  static _pipeVerdict(command, name, previous) {
    const verdict = PipeToShell.assess(command, name, previous);
    return verdict ? ShellClassifier._verdict(name, command.args, verdict.tier, verdict.reason) : null;
  }

  static _wrapperVerdict(command, name, dialect, depth) {
    const unwrapped = ShellWrapper.unwrap(name, command.args, dialect);
    if (!unwrapped) return null;
    if (unwrapped.opaque) return ShellClassifier._verdict(name, command.args, unwrapped.tier || ShellTier.NORMAL, unwrapped.reason);
    const inner = ShellClassifier._classifyIn(unwrapped.command, unwrapped.dialect || dialect, depth + 1);
    if (unwrapped.elevated) return ShellClassifier._elevatedVerdict(command, name, inner);
    const summary = ShellClassifier._summarize(inner, unwrapped.command);
    if (ShellClassifier._hasFileRedirect(command) && summary.tier === ShellTier.READONLY) summary.tier = ShellTier.NORMAL;
    return summary;
  }

  static _elevatedVerdict(command, name, inner) {
    const innerNames = inner.commands.map((verdict) => verdict.name).filter(Boolean);
    const writes = ShellTier.isAtLeast(inner.tier, ShellTier.MASS_DESTRUCTIVE)
      || innerNames.some((innerName) => PrivilegeWrapper.ESCALATED_WRITERS.has(innerName));
    if (!writes) return ShellClassifier._verdict(name, command.args, ShellTier.NORMAL, null);
    const reason = `Running ${innerNames[0] || 'that'} with elevated privileges can change the whole machine.`;
    return ShellClassifier._verdict(name, command.args, ShellTier.FORBIDDEN, reason);
  }

  static _ruleVerdict(command, name, dialect) {
    const readonlyEligible = command.assignments.length === 0 && !ShellClassifier._hasFileRedirect(command);
    const verdict = ShellRuleSet.assess({ name, args: command.args, dialect, assignments: command.assignments }, { readonlyEligible });
    if (verdict && verdict.tier === ShellTier.FORBIDDEN) return ShellClassifier._verdict(name, command.args, ShellTier.FORBIDDEN, verdict.reason);
    if (ShellClassifier._writesRawDisk(command)) return ShellClassifier._verdict(name, command.args, ShellTier.FORBIDDEN, 'Writing to a raw disk device destroys the disk.');
    if (verdict) return ShellClassifier._verdict(name, command.args, verdict.tier, verdict.reason);
    return ShellClassifier._verdict(name, command.args, ShellTier.NORMAL, null);
  }

  static _hasFileRedirect(command) {
    return command.redirects.some((redirect) => !RedirectTarget.isNull(redirect.target));
  }

  static _writesRawDisk(command) {
    return command.redirects.some((redirect) => ShellClassifier.RAW_DISK_TARGET.test(redirect.target));
  }

  static _verdict(name, args, tier, reason) {
    return { name, args, tier, reason };
  }

  static _summarize(classification, label) {
    const limit = ShellClassifier.LABEL_LIMIT;
    const name = label.length > limit ? `${label.slice(0, limit - 3)}...` : label;
    return { name, args: [], tier: classification.tier, reason: classification.reasons[0] || null, inner: classification.commands };
  }
}

module.exports = ShellClassifier;
