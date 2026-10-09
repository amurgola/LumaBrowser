const { execFile } = require('child_process');
const FirewallCommands = require('./FirewallCommands');
const ShellQuote = require('./ShellQuote');

class Firewall {
  static RULE_NAME = FirewallCommands.RULE_NAME;
  static COMMAND_TIMEOUT_MS = 60000;
  static UFW_MISSING_EXIT_CODE = 66;
  static DEFAULT_ERROR = 'Could not update the firewall.';
  static POWERSHELL_ARGS = ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command'];
  static NO_UFW_HINT = 'No ufw firewall found. Your distro likely allows LAN connections already. If you use firewalld, allow the ports manually.';
  static ADVICE = {
    windowsPublic: 'This network is set to "Public", so Windows blocks incoming connections. Allow LumaBrowser through the firewall, or set the network to "Private".',
    windows: 'If other devices can\'t connect, allow LumaBrowser through Windows Firewall.',
    darwin: 'If other devices can\'t connect, allow LumaBrowser in System Settings → Network → Firewall (a signed build is usually allowed automatically).',
    linux: 'Most Linux desktops allow LAN connections by default. If you run ufw/firewalld, allow the sharing ports.',
    unreadable: 'Could not read firewall status.',
  };

  static async ensureAllowed({ exePath, appPath, ports } = {}) {
    const platform = process.platform;
    try {
      if (platform === 'win32') return await Firewall._ensureWindows(exePath);
      if (platform === 'darwin') return await Firewall._ensureMac(appPath);
      if (platform === 'linux') return await Firewall._ensureLinux(ports);
      return { success: false, platform, manual: 'Unsupported platform.' };
    } catch (e) {
      return { success: false, platform, error: (e && e.message) || 'Firewall update failed.' };
    }
  }

  static async detect() {
    const platform = process.platform;
    const base = { platform, manageable: ['win32', 'darwin', 'linux'].includes(platform) };
    try {
      if (platform === 'win32') return { ...base, ...(await Firewall._detectWindows()) };
      const advice = platform === 'darwin' ? Firewall.ADVICE.darwin : Firewall.ADVICE.linux;
      return { ...base, ruleInstalled: null, publicNetwork: null, advice };
    } catch (_) {
      return { ...base, ruleInstalled: null, publicNetwork: null, advice: Firewall.ADVICE.unreadable };
    }
  }

  static async _ensureWindows(exePath) {
    const inner = FirewallCommands.windowsEnsure(exePath || process.execPath);
    const result = await Firewall._powershell(FirewallCommands.windowsElevate(inner));
    return Firewall._outcome('win32', result);
  }

  static async _ensureMac(appPath) {
    const script = FirewallCommands.macAllow(appPath || process.execPath);
    const result = await Firewall._run('osascript', ['-e', `do shell script ${ShellQuote.posix(script)} with administrator privileges`]);
    return Firewall._outcome('darwin', result);
  }

  static async _ensureLinux(ports) {
    const script = FirewallCommands.linuxUfw(ports);
    const guarded = `command -v ufw >/dev/null 2>&1 && { ${script}; } || exit ${Firewall.UFW_MISSING_EXIT_CODE}`;
    const result = await Firewall._run('pkexec', ['sh', '-c', guarded]);
    if (!result.ok && result.err && result.err.code === Firewall.UFW_MISSING_EXIT_CODE) {
      return { success: false, platform: 'linux', manual: Firewall.NO_UFW_HINT };
    }
    return Firewall._outcome('linux', result);
  }

  static async _detectWindows() {
    const result = await Firewall._powershell(FirewallCommands.windowsDetect());
    const status = Firewall._parseWindowsStatus(result);
    const advice = status.publicNetwork ? Firewall.ADVICE.windowsPublic : Firewall.ADVICE.windows;
    return { ...status, advice };
  }

  static _parseWindowsStatus(result) {
    const unknown = { ruleInstalled: null, publicNetwork: null };
    if (!result.ok || !result.stdout.trim()) return unknown;
    try {
      const parsed = JSON.parse(result.stdout.trim());
      const categories = Array.isArray(parsed.categories) ? parsed.categories : [parsed.categories];
      return {
        ruleInstalled: !!parsed.rule,
        publicNetwork: categories.some((category) => category === 0 || category === 'Public'),
      };
    } catch (_) {
      return unknown;
    }
  }

  static _outcome(platform, result) {
    if (result.ok) return { success: true, platform, applied: true };
    return { success: false, platform, error: result.stderr || (result.err && result.err.message) || Firewall.DEFAULT_ERROR };
  }

  static _powershell(script) {
    return Firewall._run('powershell', [...Firewall.POWERSHELL_ARGS, script]);
  }

  static _run(file, args) {
    return new Promise((resolve) => {
      execFile(file, args, { timeout: Firewall.COMMAND_TIMEOUT_MS, windowsHide: true }, (err, stdout, stderr) => {
        resolve({ ok: !err, stdout: String(stdout || ''), stderr: String(stderr || ''), err });
      });
    });
  }
}

module.exports = Firewall;
