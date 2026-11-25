const AndroidSdk = require('./sdk/AndroidSdk');
const AvdCatalog = require('./sdk/AvdCatalog');
const SystemImages = require('./sdk/SystemImages');
const EmulatorFleet = require('./emulator/EmulatorFleet');

class AndroidEnvironment {
  static NO_SDK = 'The Android SDK was not found on this computer. Install Android Studio, or the SDK command-line '
    + 'tools with the emulator and a system image, then set its folder under Settings > Android.';

  constructor({ settings, locate = AndroidSdk.locate, avdHome = AndroidSdk.avdHome() }) {
    this._settings = settings;
    this._locate = locate;
    this._avdHome = avdHome;
    this._current = null;
  }

  current() {
    const sdk = this._locate(this._settings.read().sdkPath);
    if (!sdk) return null;
    if (!this._current || this._current.sdk.root !== sdk.root) this._current = this._build(sdk);
    return this._current;
  }

  required() {
    const environment = this.current();
    if (!environment) throw new Error(AndroidEnvironment.NO_SDK);
    return environment;
  }

  _build(sdk) {
    return {
      sdk,
      catalog: new AvdCatalog(this._avdHome),
      images: new SystemImages(sdk.imagesDir),
      fleet: new EmulatorFleet({ sdk, gpuMode: () => this._settings.read().gpuMode }),
    };
  }
}

module.exports = AndroidEnvironment;
