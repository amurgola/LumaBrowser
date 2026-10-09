const HostCapability = require('./HostCapability');
const KillRequest = require('./KillRequest');

class ProcessControl extends HostCapability {
  static OS_PROCESSES = Object.freeze(['init', 'systemd', 'launchd', 'kernel_task', 'windowserver', 'loginwindow', 'csrss', 'wininit', 'winlogon', 'lsass', 'smss', 'services', 'svchost']);
  static OS_PIDS = Object.freeze({ posix: ['1'], windows: ['0', '4'] });
  static SHARED_PROCESSES = Object.freeze(['node', 'electron', 'lumabrowser', 'python', 'python3', 'java', 'sh', 'bash', 'zsh', 'fish', 'cmd', 'powershell', 'pwsh', 'conhost', 'explorer', 'dwm', 'finder', 'dock']);

  covers(command) {
    return KillRequest.parse(command) !== null;
  }

  judge(command) {
    const request = KillRequest.parse(command);
    const forbidden = ProcessControl._everythingReason(command, request) || ProcessControl._osReason(request);
    return HostCapability.forbid(forbidden) || HostCapability.ask(ProcessControl._breadthReason(command, request));
  }

  static _everythingReason(command, request) {
    if (request.platform === 'posix' && request.pids.includes('-1')) return `${command.display} -1 signals every process on the machine.`;
    if (request.patterns.some((pattern) => pattern.hitsEverything())) return `${command.display} with a catch-all pattern ends every process.`;
    return request.userWide ? `${command.display} -u with no name ends every process the user owns, including this session.` : null;
  }

  static _osReason(request) {
    const pid = request.pids.find((candidate) => ProcessControl.OS_PIDS[request.platform].includes(candidate));
    if (pid) return `Process ${pid} is part of the operating system; killing it crashes the machine or ends the session.`;
    const name = ProcessControl.OS_PROCESSES.find((candidate) => request.patterns.some((pattern) => pattern.names(candidate)));
    return name ? `${name} is part of the operating system; killing it crashes the machine or ends the session.` : null;
  }

  static _breadthReason(command, request) {
    const shared = request.hard && ProcessControl.SHARED_PROCESSES.find((candidate) => request.patterns.some((pattern) => pattern.names(candidate)));
    if (shared) return `${command.display} force-kills every ${shared} process, including this app's own.`;
    if (request.patterns.some((pattern) => pattern.isWildcard())) return `${command.display} with a wildcard name ends many processes at once.`;
    if (request.hard && request.tree) return `${command.display} /F /T ends a whole process tree.`;
    if (request.hard && request.filtered) return `${command.display} /F /FI ends every process the filter matches.`;
    return ProcessControl._groupReason(command, request);
  }

  static _groupReason(command, request) {
    if (request.platform !== 'posix') return null;
    const group = request.pids.find((pid) => pid === '0' || /^-\d+$/.test(pid));
    return group ? `${command.display} ${group} signals a whole process group.` : null;
  }
}

module.exports = ProcessControl;
