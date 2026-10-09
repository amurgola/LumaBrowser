const MediaLaunchPlanner = require('../../media-shared/MediaLaunchPlanner');
const VramCoordinator = require('../../shared/runtime/VramCoordinator');
const WslFormat = require('../runtimes/WslFormat');
const MusicVramShortfall = require('./MusicVramShortfall');

class MusicLaunchPlanner extends MediaLaunchPlanner {
  static SERVER_ID = 'music';
  static ROLE = 'music';
  static WSL_EXE = 'C:\\Windows\\System32\\wsl.exe';
  static HEALTH_TIMEOUT_MNT_MS = 20 * 60 * 1000;
  static HEALTH_TIMEOUT_NATIVE_MS = 8 * 60 * 1000;
  static SERVE_HOST = '0.0.0.0';
  static CLIENT_HOST = '127.0.0.1';
  static NOT_INSTALLED_MESSAGE = 'Music runtime is not installed (no sgl-omni entrypoint).';
  static NO_ROOM_MESSAGE = 'Not enough free GPU memory for music generation right now';
  static NO_ROOM_ADVICE = 'Stop or unload other model servers and try again, or pin music to '
    + 'specific GPUs with the core.musicServer.cudaDevice setting.';

  constructor({ vramCoordinator = VramCoordinator.shared, platform = process.platform } = {}) {
    super();
    this._vram = vramCoordinator;
    this._platform = platform;
  }

  plan(options) {
    const launch = super.plan(options);
    return { ...launch, cudaDevice: this._launchCudaDevice(), healthTimeoutMs: this._healthTimeoutMs() };
  }

  _validate() {
    this._requireOption('runtimeRow');
    this._requireOption('model');
    this._requireOption('modelPath');
    this._requireOption('port');
    this._binPath = this._resolveEntrypoint();
  }

  _resolveSettings() {
    this._resolveRuntimeShape();
    this._reservation = this._reserveCards();
    this._refuseUnusableReservation();
    this._useDual = this._isDualPlacement();
    this._runtimeModelPath = this._mode === 'wsl' ? WslFormat.toWslPath(this._options.modelPath) : this._options.modelPath;
  }

  _buildArgs() {
    return this._mode === 'wsl' ? this._wslArgs() : this._serveArgs();
  }

  _resolveBinaryPath() {
    return this._mode === 'wsl' ? MusicLaunchPlanner.WSL_EXE : this._binPath;
  }

  _describePlan() {
    return {
      port: this._options.port,
      host: MusicLaunchPlanner.CLIENT_HOST,
      mode: this._mode,
      distro: this._distro,
      modelId: this._options.model.id,
      runtimeId: this._options.runtimeRow.id,
      modelPath: this._options.modelPath,
      apiModelName: this._runtimeModelPath,
      cudaDevice: this._reservation.cudaDevice,
      devices: this._reservation.devices,
      profile: this._useDual ? 'dual' : 'single',
    };
  }

  _resolveEntrypoint() {
    const row = this._options.runtimeRow;
    const binPath = (row.manifest && row.manifest.binPath) || row.binaryPath;
    if (!binPath) throw new Error(MusicLaunchPlanner.NOT_INSTALLED_MESSAGE);
    return binPath;
  }

  _resolveRuntimeShape() {
    const manifest = this._options.runtimeRow.manifest;
    this._mode = (manifest && manifest.mode) || (this._platform === 'win32' ? 'wsl' : 'native');
    this._distro = (manifest && manifest.distro) || null;
  }

  _reserveCards() {
    const { model, settingsDb, diagnostics } = this._options;
    return this._vram.reserve({
      serverId: MusicLaunchPlanner.SERVER_ID,
      role: MusicLaunchPlanner.ROLE,
      requiredBytes: MusicVramShortfall.colocatedBytes(model),
      allowSplit: !!model.dualGpuOk,
      settingsDb,
      diagnostics,
    });
  }

  _refuseUnusableReservation() {
    if (this._reservation.offloadToCpu) this._refuse(`${MusicLaunchPlanner.NO_ROOM_MESSAGE}. `);
    const shortfall = MusicVramShortfall.describe({
      reservation: this._reservation,
      model: this._options.model,
      settingsDb: this._options.settingsDb,
      diagnostics: this._options.diagnostics,
      vramCoordinator: this._vram,
    });
    if (shortfall) this._refuse(`${MusicLaunchPlanner.NO_ROOM_MESSAGE} (${shortfall}). `);
  }

  _refuse(lead) {
    this._vram.release(MusicLaunchPlanner.SERVER_ID);
    throw new Error(lead + MusicLaunchPlanner.NO_ROOM_ADVICE);
  }

  _isDualPlacement() {
    const devices = this._reservation.devices;
    return !!this._options.model.dualGpuOk && Array.isArray(devices) && devices.length >= 2;
  }

  _serveArgs() {
    const profiles = this._options.model.launchProfiles || {};
    const profileArgs = (this._useDual ? profiles.dual : profiles.single) || [];
    return [
      'serve',
      '--model-path', this._runtimeModelPath,
      '--host', MusicLaunchPlanner.SERVE_HOST,
      '--port', String(this._options.port),
      ...profileArgs,
      ...(this._options.extraServeArgs || []),
    ];
  }

  _wslArgs() {
    const quotedArgs = this._serveArgs().map(WslFormat.shellQuote).join(' ');
    const command = `exec ${this._wslEnvPrefix()}${WslFormat.shellQuote(this._binPath)} ${quotedArgs}`;
    return [...(this._distro ? ['-d', this._distro] : []), '--', 'bash', '-lc', command];
  }

  _wslEnvPrefix() {
    const parts = [];
    const venvBin = this._binPath.includes('/') ? this._binPath.slice(0, this._binPath.lastIndexOf('/')) : '';
    if (venvBin) parts.push(`PATH=${WslFormat.shellQuote(venvBin)}:"$PATH"`);
    const cudaDevice = this._reservation.cudaDevice;
    if (cudaDevice != null && cudaDevice !== '') parts.push(`CUDA_VISIBLE_DEVICES=${cudaDevice}`);
    return parts.length ? `env ${parts.join(' ')} ` : '';
  }

  _launchCudaDevice() {
    return this._mode === 'wsl' ? null : this._reservation.cudaDevice;
  }

  _healthTimeoutMs() {
    return this._runtimeModelPath.startsWith('/mnt/')
      ? MusicLaunchPlanner.HEALTH_TIMEOUT_MNT_MS
      : MusicLaunchPlanner.HEALTH_TIMEOUT_NATIVE_MS;
  }
}

module.exports = MusicLaunchPlanner;
