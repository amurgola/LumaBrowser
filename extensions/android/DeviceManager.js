class DeviceManager {
  constructor({ environment, sessions }) {
    this._environment = environment;
    this._sessions = sessions;
  }

  async overview() {
    const environment = this._environment.current();
    if (!environment) return { sdk: { found: false, root: '', hasEmulator: false }, devices: [], images: [] };
    const running = environment.sdk.hasEmulator() ? await environment.fleet.running() : new Map();
    return {
      sdk: { found: true, root: environment.sdk.root, hasEmulator: environment.sdk.hasEmulator() },
      devices: environment.catalog.list().map((device) => ({ ...device, state: DeviceManager._state(device.name, running, environment.fleet) })),
      images: environment.images.list(),
    };
  }

  async start(name) {
    this._known(name);
    return (await this._sessions.open(name)).describe();
  }

  async stop(name) {
    const { fleet } = this._known(name);
    await this._sessions.close(name);
    return fleet.stop(name);
  }

  create() {
    const { catalog, images } = this._environment.required();
    const [image] = images.list();
    if (!image) throw new Error('No Android system image is installed. Add one with the SDK Manager, then try again.');
    return catalog.create({ name: catalog.freeName(), image });
  }

  async runningNames() {
    const environment = this._environment.current();
    if (!environment || !environment.sdk.hasEmulator()) return [];
    return [...(await environment.fleet.running()).keys()];
  }

  async stopStarted() {
    await this._sessions.closeAll();
    const environment = this._environment.current();
    if (environment) await environment.fleet.stopStarted();
  }

  _known(name) {
    const environment = this._environment.required();
    if (!environment.sdk.hasEmulator()) throw new Error('The Android SDK has no emulator. Add "Android Emulator" with the SDK Manager.');
    if (!environment.catalog.has(name)) throw new Error(`There is no device named ${name}`);
    return environment;
  }

  static _state(name, running, fleet) {
    if (fleet.isStarting(name)) return 'starting';
    return running.has(name) ? 'running' : 'stopped';
  }
}

module.exports = DeviceManager;
