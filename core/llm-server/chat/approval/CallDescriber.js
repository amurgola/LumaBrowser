const CardText = require('./CardText');
const CommandCallAssessor = require('./CommandCallAssessor');

class CallDescriber {
  static describe(toolName, params, assessment) {
    const p = params || {};
    if (assessment && assessment.detail && CommandCallAssessor.isCommandTool(toolName)) return assessment.detail;
    const describer = CallDescriber._DESCRIBERS[toolName];
    return describer ? describer(p) : `Run ${CardText.clip(toolName)}`;
  }

  static _runCommand(p) {
    const where = p.cwd && p.cwd !== '.' ? ` in ${CardText.clip(p.cwd, 40)}` : '';
    return `Run \`${CardText.clip(p.command, 120)}\`${where}`;
  }

  static _overwrite(p) {
    const chars = typeof p.content === 'string' ? p.content.length : 0;
    return `Overwrite ${CardText.clip(p.path)} with ${chars} characters`;
  }

  static _edit(p) {
    const count = Array.isArray(p.edits) ? p.edits.length : 0;
    return `Edit ${CardText.clip(p.path)} (${count} replacement${count === 1 ? '' : 's'})`;
  }

  static _ntfy(p) {
    const target = p.topic ? ` to "${CardText.clip(p.topic, 60)}"` : ' to the default ntfy topic';
    return `Send a phone notification${target}`;
  }

  static _createScheduledTask(p) {
    const every = p.every_minutes ? ` (every ${p.every_minutes} min)` : '';
    return `Create the scheduled task "${CardText.clip(p.title || 'untitled', 60)}"${every}`;
  }

  static _scheduleArtifactUpdates(p) {
    const every = p.everyMinutes ? ` every ${p.everyMinutes} min` : '';
    return `Schedule a background refresh${every} for widget ${CardText.clip(p.artifactId)}`;
  }

  static _DESCRIBERS = Object.assign(Object.create(null), {
    run_command: (p) => CallDescriber._runCommand(p),
    write_file: (p) => CallDescriber._overwrite(p),
    write_extension_file: (p) => CallDescriber._overwrite(p),
    edit_file: (p) => CallDescriber._edit(p),
    install_extension: (p) => `Install the extension "${CardText.clip(p.name || p.id || 'this build')}" into the app`,
    discard_build: (p) => `Delete the current build${p.id ? ` (${CardText.clip(p.id)})` : ''}`,
    send_webhook: (p) => `Send a webhook to ${CardText.clip(p.url, 80)}`,
    send_notification_ntfy: (p) => CallDescriber._ntfy(p),
    timed_tasks_create: (p) => `Create the recurring task "${CardText.clip(p.name || 'untitled', 60)}"`,
    timed_tasks_delete: (p) => `Delete timed task ${CardText.clip(p.id)} and its run history`,
    timed_tasks_trigger: (p) => `Run timed task ${CardText.clip(p.id)} now`,
    create_scheduled_task: (p) => CallDescriber._createScheduledTask(p),
    update_scheduled_task: () => 'Change the scheduled task defined in this conversation',
    run_scheduled_task: () => 'Run the scheduled task defined in this conversation now',
    schedule_artifact_updates: (p) => CallDescriber._scheduleArtifactUpdates(p),
  });
}

module.exports = CallDescriber;
