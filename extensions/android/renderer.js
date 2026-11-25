(function () {
  'use strict';

  const EXTENSION_ID = 'android';
  const REFRESH_MS = 2000;
  const CHECKBOXES = ['fitToFrame', 'relayNotifications', 'agentAccess', 'stopOnQuit'];

  const SETTINGS_HTML = `
    <div class="luma-field">
      <div class="luma-field-help" id="ext-android-sdk" role="status"></div>
    </div>
    <h3 class="luma-section-label">Devices</h3>
    <div id="ext-android-devices"></div>
    <div class="luma-form-actions">
      <button type="button" class="luma-btn" id="ext-android-create">New device</button>
      <span class="luma-muted" id="ext-android-status" role="status" aria-live="polite"></span>
    </div>
    <h3 class="luma-section-label">Settings</h3>
    <div class="luma-field">
      <label class="luma-check"><input type="checkbox" id="ext-android-fitToFrame"> Size the device's screen to its tab</label>
    </div>
    <div class="luma-field">
      <label class="luma-check"><input type="checkbox" id="ext-android-relayNotifications"> Send device notifications to the Hub</label>
    </div>
    <div class="luma-field">
      <label class="luma-check"><input type="checkbox" id="ext-android-agentAccess"> Let AI use Android devices</label>
      <div class="luma-field-help">The android_* tools, for chat and for outside agents. A chat asks before each action that changes something.</div>
    </div>
    <div class="luma-field">
      <label class="luma-check"><input type="checkbox" id="ext-android-stopOnQuit"> Shut devices down when LumaBrowser quits</label>
      <div class="luma-field-help">A device saves its state as it shuts down, so it is back in a few seconds.</div>
    </div>
    <div class="luma-field">
      <label class="luma-field-label" for="ext-android-gpuMode">Graphics</label>
      <select class="luma-field-select" id="ext-android-gpuMode">
        <option value="host">Graphics card</option>
        <option value="swiftshader_indirect">Processor only</option>
      </select>
      <div class="luma-field-help">Used the next time a device starts. Changing it makes that one start a full boot.</div>
    </div>
    <div class="luma-field">
      <label class="luma-field-label" for="ext-android-sdkPath">Android SDK folder</label>
      <input type="text" class="luma-field-input" id="ext-android-sdkPath" placeholder="Found automatically" autocomplete="off">
      <div class="luma-field-help">Only needed when the SDK is somewhere unusual.</div>
    </div>
  `;

  class DeviceRows {
    static STATES = { running: 'Running', starting: 'Starting', stopped: 'Stopped' };

    static LABELS = { open: 'Open', start: 'Start', stop: 'Stop' };

    constructor(container, onAction) {
      this._container = container;
      this._onAction = onAction;
    }

    render(devices, sdk) {
      this._container.replaceChildren(...(devices.length ? devices.map((device) => this._row(device, sdk)) : [DeviceRows._empty(sdk)]));
    }

    static describe(device) {
      const version = device.target ? device.target.replace('android-', 'Android ') : 'Android';
      return `${version}${device.playStore ? ', Google Play' : ''}. ${DeviceRows.STATES[device.state] || device.state}`;
    }

    static actionsFor(state) {
      if (state === 'running') return ['open', 'stop'];
      return state === 'starting' ? ['open'] : ['open', 'start'];
    }

    static _empty(sdk) {
      const empty = document.createElement('div');
      empty.className = 'luma-empty luma-empty--plain';
      empty.textContent = sdk.found
        ? 'No devices yet. New device makes one from the newest Android image installed.'
        : 'Devices appear here once the Android SDK is installed.';
      return empty;
    }

    _row(device, sdk) {
      const row = DeviceRows._element('div', 'luma-card');
      const top = DeviceRows._element('div', 'luma-card-top');
      const main = DeviceRows._element('div', 'luma-card-main');
      main.append(DeviceRows._element('div', 'luma-card-name', device.label), DeviceRows._element('div', 'luma-card-desc', DeviceRows.describe(device)));
      top.append(main, this._buttons(device, sdk));
      row.append(top);
      return row;
    }

    _buttons(device, sdk) {
      const buttons = DeviceRows._element('div', 'luma-form-actions');
      for (const action of DeviceRows.actionsFor(device.state)) {
        const button = DeviceRows._element('button', 'luma-btn luma-btn--sm', DeviceRows.LABELS[action]);
        button.type = 'button';
        button.disabled = !sdk.hasEmulator;
        button.addEventListener('click', () => this._onAction(action, device.name));
        buttons.append(button);
      }
      return buttons;
    }

    static _element(tag, className, text) {
      const element = document.createElement(tag);
      element.className = className;
      if (text !== undefined) element.textContent = text;
      return element;
    }
  }

  class AndroidSettingsTab {
    constructor() {
      this._ipc = null;
      this._container = null;
      this._rows = null;
      this._refreshTimer = null;
    }

    async activate(context) {
      this._ipc = context.ipcBridge;
      this._container = context.slotManager.register('settings-tab', EXTENSION_ID, SETTINGS_HTML, {
        label: 'Android', tabId: EXTENSION_ID, placement: 'tab', onActivate: () => this._load(),
      });
      if (!this._container) return;
      this._rows = new DeviceRows(this._element('devices'), (action, name) => this._deviceAction(action, name));
      this._bindEvents();
      await this._load();
    }

    deactivate() {
      clearTimeout(this._refreshTimer);
    }

    static sdkLine(sdk) {
      if (!sdk.found) return 'The Android SDK was not found. Install Android Studio, or the SDK command-line tools with the emulator and a system image.';
      if (!sdk.hasEmulator) return `Android SDK at ${sdk.root}, but it has no emulator. Add "Android Emulator" with the SDK Manager.`;
      return `Android SDK at ${sdk.root}`;
    }

    _element(name) {
      return this._container.querySelector(`#ext-android-${name}`);
    }

    _bindEvents() {
      for (const name of [...CHECKBOXES, 'gpuMode', 'sdkPath']) {
        this._element(name).addEventListener('change', () => this._save());
      }
      this._element('create').addEventListener('click', () => this._run('create', 'Making a new device...'));
    }

    async _invoke(channel, ...args) {
      const reply = await this._ipc.invoke(`ext.${EXTENSION_ID}.${channel}`, ...args);
      if (!reply || reply.success === false) throw new Error((reply && reply.error) || 'No answer from the app');
      return reply.data;
    }

    async _load() {
      clearTimeout(this._refreshTimer);
      try {
        this._show(await this._invoke('overview'));
      } catch (error) {
        this._say(error.message, true);
      }
    }

    _show(overview) {
      this._element('sdk').textContent = AndroidSettingsTab.sdkLine(overview.sdk);
      this._rows.render(overview.devices, overview.sdk);
      this._element('create').disabled = !overview.sdk.found || !overview.images.length;
      for (const name of CHECKBOXES) this._element(name).checked = !!overview.settings[name];
      this._element('gpuMode').value = overview.settings.gpuMode;
      if (document.activeElement !== this._element('sdkPath')) this._element('sdkPath').value = overview.settings.sdkPath;
      if (overview.devices.some((device) => device.state === 'starting')) {
        this._refreshTimer = setTimeout(() => this._load(), REFRESH_MS);
      }
    }

    async _save() {
      const patch = { gpuMode: this._element('gpuMode').value, sdkPath: this._element('sdkPath').value };
      for (const name of CHECKBOXES) patch[name] = this._element(name).checked;
      await this._run('saveSettings', '', patch);
    }

    _deviceAction(action, name) {
      const busy = { start: `Starting ${name}...`, stop: `Shutting ${name} down...`, open: '' }[action];
      return this._run(action, busy, name);
    }

    async _run(channel, busyText, ...args) {
      this._say(busyText);
      if (channel === 'start') this._refreshTimer = setTimeout(() => this._load(), REFRESH_MS);
      try {
        await this._invoke(channel, ...args);
        this._say('');
      } catch (error) {
        this._say(error.message, true);
      }
      await this._load();
    }

    _say(text, isError = false) {
      const status = this._element('status');
      status.textContent = text;
      status.className = isError ? 'luma-form-err' : 'luma-muted';
    }
  }

  const tab = new AndroidSettingsTab();
  window.__ext_android = {
    activate: (context) => tab.activate(context),
    deactivate: () => tab.deactivate(),
    AndroidSettingsTab,
    DeviceRows,
  };
})();
