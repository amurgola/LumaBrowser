import DeviceConnection from './DeviceConnection.js';
import FrameFit from './FrameFit.js';
import InputRelay from './InputRelay.js';
import PageApi from './PageApi.js';
import PageNotice from './PageNotice.js';
import VideoPlayer from './VideoPlayer.js';

class DevicePage {
  constructor() {
    this._deviceName = new URLSearchParams(window.location.search).get('device') || '';
    this._api = new PageApi();
    this._notice = new PageNotice();
    this._canvas = document.getElementById('screen');
    this._toolbar = document.getElementById('toolbar');
    this._player = new VideoPlayer(this._canvas);
    this._connection = null;
    this._fit = new FrameFit(document.getElementById('stage'), (message) => this._send(message));
    this._watchingFrame = false;
    this._hasFailed = false;
  }

  start() {
    if (!this._deviceName) { this._chooseDevice(); return; }
    document.title = DevicePage.titleOf(this._deviceName);
    this._toolbar.hidden = false;
    new InputRelay(this._canvas, (message) => this._send(message)).attach();
    this._wireToolbar();
    this._connect();
  }

  static titleOf(deviceName) {
    return deviceName.replace(/_/g, ' ');
  }

  async _chooseDevice() {
    try {
      const { sdk, devices } = await this._api.devices();
      if (!sdk.found) { this._notice.show('The Android SDK was not found on this computer. Set it up under Settings > Android.'); return; }
      if (!devices.length) { this._notice.show('There are no Android devices yet. Make one under Settings > Android.'); return; }
      this._notice.choose('Pick a device', devices.map((device) => ({
        label: device.label,
        run: () => { window.location.search = `?device=${encodeURIComponent(device.name)}`; },
      })));
    } catch (error) {
      this._notice.show(error.message, { label: 'Try again', run: () => this._chooseDevice() });
    }
  }

  async _connect() {
    this._showNotice(`Starting ${DevicePage.titleOf(this._deviceName)}...`);
    this._connection = new DeviceConnection(this._api, this._deviceName, {
      message: (message) => this._onMessage(message),
      configurationBytes: (bytes) => this._player.setConfigurationBytes(bytes),
      frame: (frame) => this._player.decode(frame),
      closed: () => this._onClosed(),
    });
    try {
      await this._connection.open();
    } catch (error) {
      this._failed(error.message);
    }
  }

  _onMessage(message) {
    const handlers = {
      status: () => { if (message.state === 'failed') this._failed(message.message); },
      hello: () => this._onHello(message),
      video: () => this._onVideo(message),
    };
    if (handlers[message.type]) handlers[message.type]();
  }

  _onHello(message) {
    document.title = `${DevicePage.titleOf(this._deviceName)} (Android ${message.device.release})`;
    if (!message.fitToFrame) return;
    if (!this._watchingFrame) { this._watchingFrame = true; this._fit.attach(); }
    this._fit.requestNow();
  }

  _onVideo(message) {
    this._player.onFirstFrame = () => { this._notice.hide(); this._canvas.hidden = false; };
    this._player.configure(message);
  }

  _onClosed() {
    if (this._hasFailed) return;
    this._showNotice(`${DevicePage.titleOf(this._deviceName)} is not connected.`, { label: 'Start', run: () => this._connect() });
  }

  _failed(reason) {
    this._hasFailed = true;
    this._showNotice(reason || 'The device could not be started.', { label: 'Try again', run: () => { this._hasFailed = false; this._connect(); } });
  }

  _showNotice(text, action) {
    this._canvas.hidden = true;
    this._notice.show(text, action);
  }

  _wireToolbar() {
    for (const button of this._toolbar.querySelectorAll('[data-button]')) {
      button.addEventListener('click', () => { this._send({ type: 'button', name: button.dataset.button }); this._canvas.focus(); });
    }
  }

  _send(message) {
    if (this._connection) this._connection.send(message);
  }
}

new DevicePage().start();
