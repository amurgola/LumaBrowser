const GitConfigKeys = require('./GitConfigKeys');
const GitOptionScan = require('./GitOptionScan');
const GitReadForms = require('./GitReadForms');

class GitProgramHazards {
  static PROGRAM_OPTIONS = Object.freeze([
    { subcommands: ['fetch', 'pull'], long: '--upload-pack', runs: 'as the remote upload-pack' },
    { subcommands: ['clone', 'ls-remote'], long: '--upload-pack', short: 'u', runs: 'as the remote upload-pack' },
    { subcommands: ['push'], long: '--receive-pack', runs: 'as the remote receive-pack' },
    { subcommands: ['push', 'archive'], long: '--exec', runs: 'on the remote end' },
    { subcommands: ['clone', 'init'], long: '--template', runs: 'as hooks copied from the template directory' },
    { subcommands: ['difftool'], long: '--extcmd', short: 'x', runs: 'as the diff tool' },
    { subcommands: ['grep'], long: '--open-files-in-pager', short: 'O', attachedOnly: true, runs: 'as the pager' },
  ]);

  static CONFIG_WRITE_MODES = Object.freeze({
    switches: ['--add', '--replace-all', '--unset', '--unset-all', '--rename-section', '--remove-section', '--edit', '-e'],
    values: ['--comment'],
  });

  static CONFIG_REMOVALS = ['--unset', '--unset-all', '--rename-section', '--remove-section'];

  static reason(invocation, assignments = []) {
    return GitProgramHazards._execPathReason(invocation)
      || GitProgramHazards._overrideReason(invocation.overrides, invocation.subcommand)
      || GitProgramHazards._assignmentReason(assignments, invocation.subcommand)
      || GitProgramHazards._optionReason(invocation.subcommand, invocation.rest)
      || GitProgramHazards._cloneConfigReason(invocation.subcommand, invocation.rest)
      || GitProgramHazards._configWriteReason(invocation.subcommand, invocation.rest);
  }

  static _launches(what) {
    return `${what}, so git would run a program of the caller's choosing.`;
  }

  static _execPathReason(invocation) {
    if (invocation.execPath === null) return null;
    return 'git --exec-path=<dir> runs git\'s own subcommands from that directory, so any program there can run.';
  }

  static _overrideReason(overrides, subcommand) {
    const risky = overrides.find((override) => GitProgramHazards._runsProgram(override.key, override.value)
      && GitProgramHazards._reachable(GitConfigKeys.programLabel(override.key), subcommand));
    if (!risky) return null;
    return GitProgramHazards._launches(`git ${risky.via} ${risky.key}=... sets ${GitConfigKeys.programLabel(risky.key)}`);
  }

  static _assignmentReason(assignments, subcommand) {
    const risky = assignments.find((assignment) => GitProgramHazards._variableRunsProgram(assignment)
      && GitProgramHazards._reachable(GitConfigKeys.variableLabel(assignment.name, assignment.value), subcommand));
    if (!risky) return null;
    return GitProgramHazards._launches(`${risky.name}=... in front of git sets ${GitConfigKeys.variableLabel(risky.name, risky.value)}`);
  }

  static _optionReason(subcommand, rest) {
    const entry = GitProgramHazards.PROGRAM_OPTIONS.find((candidate) => candidate.subcommands.includes(subcommand)
      && GitProgramHazards._optionGiven(rest, candidate));
    return entry ? `git ${subcommand} ${entry.long} runs a program of the caller's choosing ${entry.runs}.` : null;
  }

  static _cloneConfigReason(subcommand, rest) {
    if (subcommand !== 'clone') return null;
    const risky = GitProgramHazards._cloneConfigPairs(rest).find((pair) => GitProgramHazards._runsProgram(pair.key, pair.value));
    if (!risky) return null;
    return GitProgramHazards._launches(`git clone -c ${risky.key}=... sets ${GitConfigKeys.programLabel(risky.key)} in the new repository`);
  }

  static _configWriteReason(subcommand, rest) {
    if (subcommand !== 'config') return null;
    const pair = GitProgramHazards._configAssignment(rest);
    if (!pair || !GitProgramHazards._runsProgram(pair.key, pair.value)) return null;
    return `git config ${pair.key} ... stores ${GitConfigKeys.programLabel(pair.key)} that git will run on later commands.`;
  }

  static _configAssignment(rest) {
    const words = rest[0] === 'set' ? rest.slice(1) : rest;
    const spec = GitProgramHazards._configSpec();
    const scan = GitOptionScan.walk(words, spec);
    if (GitProgramHazards.CONFIG_REMOVALS.some((mode) => scan.seen.has(mode))) return null;
    if (scan.positionals.length < 2) return null;
    return { key: scan.positionals[0], value: scan.positionals[1] };
  }

  static _configSpec() {
    const shared = GitReadForms.CONFIG_SHARED;
    const write = GitProgramHazards.CONFIG_WRITE_MODES;
    return { switches: [...shared.switches, ...write.switches], values: [...shared.values, ...write.values] };
  }

  static _cloneConfigPairs(rest) {
    const pairs = [];
    for (let i = 0; i < rest.length; i++) {
      const text = GitProgramHazards._cloneConfigText(rest, i);
      if (text === null) continue;
      if (text.consumedNext) i++;
      pairs.push(GitProgramHazards._splitPair(text.value));
    }
    return pairs;
  }

  static _cloneConfigText(rest, i) {
    const word = rest[i];
    if (word === '-c' || word === '--config') return { value: rest[i + 1] || '', consumedNext: true };
    if (word.startsWith('--config=')) return { value: word.slice('--config='.length), consumedNext: false };
    if (word.startsWith('-c') && !word.startsWith('--') && word.length > 2) return { value: word.slice(2), consumedNext: false };
    return null;
  }

  static _splitPair(text) {
    const eq = text.indexOf('=');
    return eq === -1 ? { key: text, value: 'true' } : { key: text.slice(0, eq), value: text.slice(eq + 1) };
  }

  static _optionGiven(rest, entry) {
    const options = GitOptionScan.optionWords(rest);
    return options.some((word, i) => GitProgramHazards._longGiven(word, entry) || GitProgramHazards._shortGiven(word, options[i + 1], entry));
  }

  static _longGiven(word, entry) {
    if (!GitOptionScan.names(word, entry.long)) return false;
    return !entry.attachedOnly || word.includes('=');
  }

  static _shortGiven(word, next, entry) {
    if (!entry.short || word.startsWith('--') || !word.startsWith('-')) return false;
    const at = word.indexOf(entry.short, 1);
    if (at === -1) return false;
    if (at < word.length - 1) return true;
    return !entry.attachedOnly && next !== undefined;
  }

  static _reachable(label, subcommand) {
    return !(GitConfigKeys.isNetworkOnly(label) && GitReadForms.staysLocal(subcommand));
  }

  static _runsProgram(key, value) {
    return GitConfigKeys.programLabel(key) !== null && !GitConfigKeys.isInert(value);
  }

  static _variableRunsProgram(assignment) {
    return GitConfigKeys.variableLabel(assignment.name, assignment.value) !== null
      && (/^GIT_CONFIG_KEY_\d+$/.test(assignment.name) || !GitConfigKeys.isInert(assignment.value));
  }
}

module.exports = GitProgramHazards;
