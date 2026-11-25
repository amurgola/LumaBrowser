const { EventEmitter } = require('events');
const DeviceDisplay = require('./DeviceDisplay');
const DeviceLink = require('./DeviceLink');
const NotificationWatcher = require('./NotificationWatcher');
const ScreenStream = require('./ScreenStream');
const UiTree = require('./UiTree');

class DeviceSession extends EventEmitter {
  static KEYS = Object.freeze({
    back: 'AndroidBack', home: 'AndroidHome', recents: 'AndroidAppSwitch', power: 'Power', enter: 'Enter',
    backspace: 'Backspace', delete: 'Delete', tab: 'Tab', escape: 'Escape', space: 'Space',
    up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight',
    volume_up: 'VolumeUp', volume_down: 'VolumeDown',
  });

  static PACKAGE_RULE = /^[A-Za-z0-9_.]+$/;
  static TAP_HOLD_MS = 60;
  static SWIPE_STEP_MS = 16;
  static SETUP_COMMAND = 'settings put system accelerometer_rotation 0; settings put system user_rotation 0; '
    + 'getprop ro.product.model; getprop ro.build.version.release';

  constructor({ name, serial, link, stream, display, watcher, tree, sleep = DeviceSession._sleep }) {
    super();
    this.name = name;
    this.serial = serial;
    this.model = '';
    this.release = '';
    this._link = link;
    this._stream = stream;
    this._display = display;
    this._watcher = watcher;
    this._tree = tree;
    this._sleep = sleep;
  }

  static async open({ name, serial, tango, serverJar }) {
    const link = await DeviceLink.connect(serial, tango);
    const shell = (command) => link.shell(command);
    return new DeviceSession({
      name, serial, link,
      stream: new ScreenStream({ adb: link.adb, tango, serverJar }),
      display: new DeviceDisplay(shell),
      watcher: new NotificationWatcher(shell),
      tree: new UiTree(shell),
    });
  }

  async start() {
    this._relayEvents();
    const [model, release] = (await this._link.shell(DeviceSession.SETUP_COMMAND)).trim().split('\n');
    this.model = model || this.name;
    this.release = release || '';
    await this._stream.start();
    await this._watcher.start();
  }

  async stop() {
    this._watcher.stop();
    await this._stream.stop();
    await this._link.close();
  }

  get video() {
    return this._stream.configuration;
  }

  describe() {
    return { name: this.name, model: this.model, release: this.release };
  }

  touch(action, x, y) { return this._stream.touch(action, x, y); }

  key(action, code, metaState) { return this._stream.key(action, code, metaState); }

  text(text) { return this._stream.text(text); }

  scroll(x, y, deltaX, deltaY) { return this._stream.scroll(x, y, deltaX, deltaY); }

  requestKeyframe() { return this._stream.requestKeyframe(); }

  fit(frame) { return this._display.fit(frame); }

  notifications() { return this._watcher.list(); }

  async pressKey(name) {
    const code = DeviceSession.KEYS[String(name || '').toLowerCase()];
    if (!code) return false;
    await this._stream.pressKey(code);
    return true;
  }

  async tap(x, y) {
    await this._stream.touch('down', x, y);
    await this._sleep(DeviceSession.TAP_HOLD_MS);
    await this._stream.touch('up', x, y);
  }

  async swipe({ fromX, fromY, toX, toY, durationMs = 300 }) {
    const steps = Math.max(2, Math.round(durationMs / DeviceSession.SWIPE_STEP_MS));
    await this._stream.touch('down', fromX, fromY);
    for (let step = 1; step <= steps; step += 1) {
      await this._sleep(DeviceSession.SWIPE_STEP_MS);
      await this._stream.touch('move', Math.round(fromX + ((toX - fromX) * step) / steps), Math.round(fromY + ((toY - fromY) * step) / steps));
    }
    await this._stream.touch('up', toX, toY);
  }

  async typeText(text, { submit = false } = {}) {
    await this._stream.text(text);
    if (submit) await this._stream.pressKey(DeviceSession.KEYS.enter);
  }

  async listApps() {
    const listing = await this._link.shell('cmd package query-activities --brief -a android.intent.action.MAIN -c android.intent.category.LAUNCHER');
    const packages = listing.split('\n').map((line) => line.trim()).filter((line) => line.includes('/')).map((line) => line.split('/')[0]);
    return [...new Set(packages)].sort();
  }

  async openApp(packageName) {
    if (!DeviceSession.PACKAGE_RULE.test(String(packageName || ''))) return false;
    const output = await this._link.shell(`monkey -p ${packageName} -c android.intent.category.LAUNCHER 1`);
    return /Events injected: 1/.test(output);
  }

  screenshot() {
    return this._link.shellBytes('screencap -p');
  }

  readScreen() {
    return this._tree.capture();
  }

  _relayEvents() {
    this._stream.on('configuration', (configuration) => this.emit('configuration', configuration));
    this._stream.on('frame', (frame) => this.emit('frame', frame));
    this._stream.on('ended', () => this.emit('ended'));
    this._watcher.on('posted', (notification) => this.emit('posted', notification));
    this._watcher.on('removed', (key) => this.emit('removed', key));
  }

  static _sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

module.exports = DeviceSession;
