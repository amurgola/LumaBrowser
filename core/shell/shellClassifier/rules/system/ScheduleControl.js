const HostCapability = require('./HostCapability');

class ScheduleControl extends HostCapability {
  static TASK_CMDLET = /^(register|unregister|set|disable|enable|new|start|stop)-scheduledtask$/;

  static CHANGES = Object.freeze({
    crontab: (command) => !command.has('-l') && (command.has('-r', '-e', '-') || command.positionals.length > 0),
    schtasks: (command) => !command.has('/query'),
    at: (command) => !command.has('-l') && command.positionals.length > 0,
  });

  covers(command) {
    return ScheduleControl.TASK_CMDLET.test(command.name) || Object.hasOwn(ScheduleControl.CHANGES, command.name);
  }

  judge(command) {
    const changes = ScheduleControl.TASK_CMDLET.test(command.name) || ScheduleControl.CHANGES[command.name](command);
    return changes ? HostCapability.ask(`${command.display} changes scheduled jobs.`) : null;
  }
}

module.exports = ScheduleControl;
