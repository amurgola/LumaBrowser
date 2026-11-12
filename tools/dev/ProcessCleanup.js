const { exec } = require('child_process');
const PortListenerParser = require('./PortListenerParser');

class ProcessCleanup {
  static PORTS = [3000, 3001];

  constructor({ run = ProcessCleanup._exec, platform = process.platform, selfPid = process.pid,
    log = console.log, dryRun = false } = {}) {
    this._run = run;
    this._platform = platform;
    this._selfPid = selfPid;
    this._log = log;
    this._dryRun = dryRun;
  }

  async execute() {
    this._log(`🧽 Starting cleanup process${this._dryRun ? ' (dry run)' : ''}...\n`);
    try {
      await this.killElectronProcesses();
      for (const port of ProcessCleanup.PORTS) await this.killNodeProcessesOnPort(port);
      this._log('\n✨ Cleanup completed!');
      return 0;
    } catch (error) {
      this._log(`❌ Cleanup failed: ${error.message}`);
      return 1;
    }
  }

  async killElectronProcesses(verbose = true) {
    const say = verbose ? this._log : () => {};
    say('🧹 Cleaning up Electron processes...');
    const found = await this._findElectron();
    if (!found) { say('✅ No Electron processes found'); return; }
    say(found.message);
    await this._terminate(found.command, '✅ Electron processes terminated', say);
  }

  async killNodeProcessesOnPort(port = 3000, verbose = true) {
    const say = verbose ? this._log : () => {};
    say(`🔍 Checking for processes using port ${port}...`);
    const pids = await this._listenersOn(port);
    if (!pids.length) { say(`✅ No processes found listening on port ${port}`); return; }
    say(`🔍 Found processes listening on port ${port}: ${pids.join(', ')}`);
    await this._terminate(this._killPidsCommand(pids), `✅ Processes using port ${port} terminated`, say);
  }

  async _findElectron() {
    if (this._platform === 'win32') {
      const { error, stdout } = await this._run('tasklist /fi "imagename eq electron.exe" /fo csv');
      if (error || !stdout.includes('electron.exe')) return null;
      return { message: '🔍 Found Electron processes, terminating...', command: 'taskkill /f /im electron.exe' };
    }
    const { error, stdout } = await this._run('pgrep -f electron');
    if (error || !stdout.trim()) return null;
    const pids = stdout.trim().split('\n');
    return { message: `🔍 Found ${pids.length} Electron process(es), terminating...`, command: `kill -9 ${pids.join(' ')}` };
  }

  async _listenersOn(port) {
    if (this._platform === 'win32') {
      const { error, stdout } = await this._run('netstat -ano -p tcp');
      return error ? [] : PortListenerParser.fromNetstat(stdout, port, this._selfPid);
    }
    const { error, stdout } = await this._run(`lsof -ti tcp:${port} -sTCP:LISTEN`);
    return error ? [] : PortListenerParser.fromLsof(stdout, this._selfPid);
  }

  _killPidsCommand(pids) {
    return this._platform === 'win32' ? `taskkill /f /pid ${pids.join(' /pid ')}` : `kill -9 ${pids.join(' ')}`;
  }

  async _terminate(command, doneMessage, say) {
    if (this._dryRun) { say(`(dry run) would run: ${command}`); return; }
    const { error } = await this._run(command);
    say(error ? `⚠️  Some processes may still be running: ${error.message}` : doneMessage);
  }

  static _exec(command) {
    return new Promise((resolve) => {
      exec(command, (error, stdout) => resolve({ error, stdout: String(stdout || '') }));
    });
  }
}

module.exports = ProcessCleanup;
