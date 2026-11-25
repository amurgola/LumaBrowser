const childProcess = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

class EmulatorFleet {
  static FIRST_PORT = 5554;
  static LAST_PORT = 5682;
  static BOOT_POLL_MS = 500;
  static BOOT_TIMEOUT_MS = 240000;
  static LOG_FOLDER = 'luma-android';

  constructor({ sdk, gpuMode, spawn = childProcess.spawn, openLog = EmulatorFleet._openLog, sleep = EmulatorFleet._sleep, now = Date.now }) {
    this._sdk = sdk;
    this._gpuMode = gpuMode;
    this._spawn = spawn;
    this._openLog = openLog;
    this._sleep = sleep;
    this._now = now;
    this._starting = new Map();
    this._started = new Set();
  }

  async running() {
    const byName = new Map();
    for (const serial of EmulatorFleet.serialsIn(await this._sdk.adb(['devices']))) {
      const name = EmulatorFleet.firstLine(await this._sdk.adb(['-s', serial, 'emu', 'avd', 'name']));
      if (name && name !== 'OK') byName.set(name, serial);
    }
    return byName;
  }

  isStarting(name) {
    return this._starting.has(name);
  }

  start(name) {
    if (!this._starting.has(name)) {
      this._starting.set(name, this._start(name).finally(() => this._starting.delete(name)));
    }
    return this._starting.get(name);
  }

  async stop(name) {
    const serial = (await this.running()).get(name);
    if (!serial) return false;
    await this._sdk.adb(['-s', serial, 'emu', 'kill']);
    this._started.delete(name);
    return true;
  }

  async stopStarted() {
    for (const name of [...this._started]) await this.stop(name);
  }

  async _start(name) {
    const startedAt = this._now();
    await this._sdk.adb(['start-server'], { timeoutMs: 30000 });
    const running = await this.running();
    const alreadyRunning = running.has(name);
    const serial = alreadyRunning ? running.get(name) : this._launch(name, EmulatorFleet.freePort([...running.values()]));
    await this._waitForBoot(serial);
    return { serial, alreadyRunning, bootSeconds: alreadyRunning ? 0 : (this._now() - startedAt) / 1000 };
  }

  _launch(name, port) {
    const log = this._openLog(name);
    const child = this._spawn(this._sdk.emulatorPath, [
      '-avd', name, '-port', String(port), '-no-window', '-no-audio', '-no-boot-anim', '-gpu', this._gpuMode(),
    ], { detached: true, stdio: ['ignore', log, log], windowsHide: true });
    child.unref();
    this._started.add(name);
    return `emulator-${port}`;
  }

  async _waitForBoot(serial) {
    const deadline = this._now() + EmulatorFleet.BOOT_TIMEOUT_MS;
    while (this._now() < deadline) {
      if (await this._sdk.adb(['-s', serial, 'shell', 'getprop', 'sys.boot_completed'], { timeoutMs: 5000 }) === '1') return;
      await this._sleep(EmulatorFleet.BOOT_POLL_MS);
    }
    throw new Error(`The device did not finish starting within ${EmulatorFleet.BOOT_TIMEOUT_MS / 1000} seconds`);
  }

  static serialsIn(devicesOutput) {
    return String(devicesOutput || '').split(/\r?\n/)
      .map((line) => line.split(/\s+/)[0])
      .filter((serial) => /^emulator-\d+$/.test(serial));
  }

  static firstLine(text) {
    return String(text || '').split(/\r?\n/)[0].trim();
  }

  static freePort(serials) {
    const taken = new Set(serials.map((serial) => Number(serial.split('-')[1])));
    for (let port = EmulatorFleet.FIRST_PORT; port <= EmulatorFleet.LAST_PORT; port += 2) {
      if (!taken.has(port)) return port;
    }
    throw new Error('Too many emulators are running to start another');
  }

  static _openLog(name) {
    const folder = path.join(os.tmpdir(), EmulatorFleet.LOG_FOLDER);
    fs.mkdirSync(folder, { recursive: true });
    return fs.openSync(path.join(folder, `emulator-${name}.log`), 'w');
  }

  static _sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

module.exports = EmulatorFleet;
