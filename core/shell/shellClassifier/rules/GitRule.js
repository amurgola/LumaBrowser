const ShellRule = require('../ShellRule');
const GitInvocation = require('./git/GitInvocation');
const GitProgramHazards = require('./git/GitProgramHazards');
const GitHistoryHazards = require('./git/GitHistoryHazards');
const GitReadForms = require('./git/GitReadForms');

class GitRule extends ShellRule {
  assess(command) {
    const invocation = GitInvocation.parse(command.name, command.args || []);
    if (!invocation) return null;
    return ShellRule.massDestructive(GitRule.hazardReason(invocation, command.assignments || []))
      || ShellRule.readonly(GitRule.isReadOnly(invocation));
  }

  static hazardReason(invocation, assignments = []) {
    return GitProgramHazards.reason(invocation, assignments)
      || GitHistoryHazards.reason(invocation.subcommand, invocation.rest);
  }

  static isReadOnly(invocation) {
    if (GitRule._alteredRun(invocation)) return false;
    if (GitInvocation.isInfoOnly(invocation)) return true;
    return Boolean(invocation.subcommand) && GitReadForms.reads(invocation.subcommand, invocation.rest);
  }

  static _alteredRun(invocation) {
    return invocation.overrides.length > 0
      || invocation.globals.some((global) => global.effect === 'config')
      || invocation.execPath !== null
      || invocation.unknownGlobals.length > 0;
  }
}

module.exports = GitRule;
