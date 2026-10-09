class ApprovalGate {
  static MUTATING_TOOLS = new Set([
    'write_file',
    'edit_file',
    'run_command',
    'write_extension_file',
    'install_extension',
    'discard_build',
    'send_webhook',
    'send_notification_ntfy',
    'timed_tasks_create',
    'timed_tasks_delete',
    'timed_tasks_trigger',
    'create_scheduled_task',
    'update_scheduled_task',
    'run_scheduled_task',
    'schedule_artifact_updates',
  ]);

  static mutatingNamesOf(toolDefs) {
    const names = new Set();
    for (const def of (Array.isArray(toolDefs) ? toolDefs : [])) {
      if (def && def.name && def.mutating === true) names.add(String(def.name));
    }
    return names;
  }

  static requiresApproval(toolName, declared, assessment) {
    const name = String(toolName || '');
    if (assessment && assessment.verdict === 'skip') return false;
    if (ApprovalGate.MUTATING_TOOLS.has(name)) return true;
    return ApprovalGate._isDeclared(declared, name);
  }

  static deniedResult(toolName, reason) {
    return {
      success: false,
      error: `${toolName} was not approved: ${reason} Do not retry this call. `
        + 'Continue with what you can do without it, and say plainly in your final answer what was left undone.',
    };
  }

  static deniedCommandResult(toolName, assessment) {
    const why = (assessment && assessment.reasons && assessment.reasons[0])
      || 'the command was classified as unsafe to run on this machine.';
    return ApprovalGate.deniedResult(toolName, `${why}${ApprovalGate._outsideNote(assessment)}`);
  }

  static _isDeclared(declared, name) {
    return !!(declared && typeof declared.has === 'function' && declared.has(name));
  }

  static _outsideNote(assessment) {
    const outside = assessment && assessment.outside;
    if (!outside || !outside.length) return '';
    return ` It would write outside the project (${outside.slice(0, 3).join(', ')}).`;
  }
}

module.exports = ApprovalGate;
