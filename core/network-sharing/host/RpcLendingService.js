const childProcess = require('child_process');
const path = require('path');
const VramCoordinator = require('../../shared/runtime/VramCoordinator');
const CudaPin = require('../../shared/runtime/CudaPin');
const FreePort = require('../../shared/runtime/FreePort');
const ChildProcessRegistry = require('../../shell/ChildProcessRegistry');
const RpcServerBinary = require('./rpc/RpcServerBinary');
const RpcDeviceInventory = require('./rpc/RpcDeviceInventory');
const RpcBindAddress = require('./rpc/RpcBindAddress');
const RpcChildTerminator = require('./rpc/RpcChildTerminator');
const RpcPortWaiter = require('./rpc/RpcPortWaiter');
const LendWaiters = require('./rpc/LendWaiters');

class RpcLendingService {
  static RPC_PORT_RANGE = FreePort.portWindow('rpcLend');
  static LEASE_TTL_MS = 75 * 1000;
  static WATCHDOG_TICK_MS = 15 * 1000;
  static DESCRIBE_CACHE_MS = 60 * 1000;
  static READY_TIMEOUT_MS = 20 * 1000;
  static DEFAULT_WAIT_FREE_MS = 30000;
  static LEND_SERVER_ID = 'gpu-lend';

  constructor({
    db = null,
    llmServerService = null,
    vramCoordinator = VramCoordinator.shared,
    spawn = childProcess.spawn,
    readDevices,
    waitForPort = RpcPortWaiter.wait,
    findFreePort = () => FreePort.findFreePort({ range: RpcLendingService.RPC_PORT_RANGE }),
    platform = process.platform,
  } = {}) {
    this.db = db;
    this.llmServerService = llmServerService;
    this._vram = vramCoordinator;
    this._spawn = spawn;
    this._inventory = new RpcDeviceInventory({ llmServerService, ...(readDevices ? { readDevices } : {}) });
    this._waitForPort = waitForPort;
    this._findFreePort = findFreePort;
    this._platform = platform;
    this._lend = null;
    this._watchdog = null;
    this._describeCache = null;
    this._waiters = new LendWaiters();
  }

  resolveBinary() {
    return RpcServerBinary.resolve(this.llmServerService, { platform: this._platform });
  }

  isSupported() {
    return !!this.resolveBinary();
  }

  async describeShare() {
    const now = Date.now();
    if (!this._describeCache || now - this._describeCache.at >= RpcLendingService.DESCRIBE_CACHE_MS) {
      const devices = this._inventory.probe();
      this._describeCache = { at: now, value: { available: devices.length > 0 && this.isSupported(), devices } };
    }
    return { ...this._describeCache.value, busy: !!this._lend };
  }

  isActive() {
    return !!this._lend;
  }

  getStatus() {
    const lend = this._lend;
    if (!lend) return { active: false };
    return { active: true, holder: lend.holder, port: lend.port, host: lend.host, devices: lend.devices.slice() };
  }

  getPortRange() {
    return { ...RpcLendingService.RPC_PORT_RANGE };
  }

  async acquire({ devices, holder, holderId = null, bindAddress } = {}) {
    const grant = this._prepareGrant({ devices, bindAddress });
    if (grant.refusal) return grant.refusal;
    grant.port = await this._findFreePort();
    this._holdCards(grant);
    const child = this._spawnServer(grant);
    if (child.error) return child.error;
    this._beginLease(grant, child.process, holder, holderId);
    return this._awaitReady(grant, child.process);
  }

  heartbeat() {
    if (!this._lend) return { success: false, gone: true };
    this._lend.lastBeatAt = Date.now();
    return { success: true, leaseMs: RpcLendingService.LEASE_TTL_MS };
  }

  async release() {
    if (this._lend) await this._teardown('released by consumer');
    return { success: true };
  }

  heartbeatFor(holderId) {
    if (!this._isHolder(holderId)) return { success: false, notHolder: true };
    return this.heartbeat();
  }

  async releaseFor(holderId) {
    if (!this._isHolder(holderId)) return { success: false, notHolder: true };
    return this.release();
  }

  _isHolder(holderId) {
    if (!this._lend || !this._lend.holderId) return true;
    return holderId === this._lend.holderId;
  }

  waitUntilFree(timeoutMs = RpcLendingService.DEFAULT_WAIT_FREE_MS) {
    if (!this._lend) return Promise.resolve(true);
    return this._waiters.wait(timeoutMs);
  }

  async shutdown() {
    if (this._lend) await this._teardown('host shutting down');
  }

  _prepareGrant({ devices, bindAddress }) {
    if (this._lend) return RpcLendingService._refusal('GPUs are already lent to another consumer.', { busy: true });
    const binary = this.resolveBinary();
    if (!binary) return RpcLendingService._refusal('No llama.cpp rpc-server binary is installed on this host.');
    const probed = this._inventory.probe();
    if (!probed.length) return RpcLendingService._refusal('This host has no CUDA devices to lend.');
    const want = RpcLendingService._grantedDevices(devices, probed);
    if (!want.length) return RpcLendingService._refusal('None of the requested devices exist on this host.');
    const host = RpcBindAddress.choose(bindAddress);
    if (!host) return RpcLendingService._refusal('Could not determine a LAN address to bind the RPC listener to.');
    return { binary, host, want, lentInfo: probed.filter((d) => want.includes(d.index)) };
  }

  static _refusal(error, extra = {}) {
    return { refusal: { success: false, ...extra, error } };
  }

  static _grantedDevices(devices, probed) {
    const known = new Set(probed.map((d) => d.index));
    if (!Array.isArray(devices) || !devices.length) return probed.map((d) => d.index);
    return devices.map((n) => Number(n)).filter((n) => known.has(n));
  }

  _holdCards(grant) {
    const bytes = grant.lentInfo.reduce((sum, d) => sum + (Number(d.vramTotalMB) || 0) * RpcDeviceInventory.MIB, 0);
    this._vram.hold(RpcLendingService.LEND_SERVER_ID, { devices: grant.want, bytes, role: 'llm' });
  }

  _spawnServer(grant) {
    try {
      const env = CudaPin.applyCudaDeviceEnv({ ...process.env }, grant.want.join(','));
      const child = ChildProcessRegistry.track(this._spawn(grant.binary, ['-H', grant.host, '-p', String(grant.port), '-c'], {
        cwd: path.dirname(grant.binary),
        env,
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true,
      }));
      this._watchChild(child);
      return { process: child };
    } catch (err) {
      this._vram.release(RpcLendingService.LEND_SERVER_ID);
      return { error: { success: false, error: `Could not start rpc-server: ${err && err.message}` } };
    }
  }

  _watchChild(child) {
    child.stdout.on('data', () => {});
    child.stderr.on('data', () => {});
    child.on('exit', () => this._endIfCurrent(child, 'rpc-server exited'));
    child.on('error', () => this._endIfCurrent(child, 'rpc-server spawn error'));
  }

  _endIfCurrent(child, reason) {
    if (this._lend && this._lend.child === child) this._teardown(reason);
  }

  _beginLease(grant, child, holder, holderId) {
    const now = Date.now();
    this._lend = {
      child,
      port: grant.port,
      host: grant.host,
      devices: grant.want,
      holder: String(holder || 'peer'),
      holderId: holderId || null,
      lastBeatAt: now,
      startedAt: now,
    };
    this._startWatchdog();
  }

  async _awaitReady(grant, child) {
    const stillWanted = () => !!this._lend && this._lend.child === child;
    const up = await this._waitForPort(grant.host, grant.port, RpcLendingService.READY_TIMEOUT_MS, stillWanted);
    if (!up) {
      await this._teardown('rpc-server never came up');
      return { success: false, error: 'rpc-server started but its port never opened. Check the host firewall.' };
    }
    console.log(`[sharing] lending GPUs [${grant.want.join(',')}] to ${this._lend.holder} on ${grant.host}:${grant.port}`);
    return { success: true, port: grant.port, devices: grant.want.slice(), leaseMs: RpcLendingService.LEASE_TTL_MS, devicesInfo: grant.lentInfo };
  }

  _startWatchdog() {
    if (this._watchdog) return;
    this._watchdog = setInterval(() => this._reapExpiredLease(), RpcLendingService.WATCHDOG_TICK_MS);
    if (this._watchdog.unref) this._watchdog.unref();
  }

  _reapExpiredLease() {
    const lend = this._lend;
    if (lend && Date.now() - lend.lastBeatAt > RpcLendingService.LEASE_TTL_MS) this._teardown('lease expired (no heartbeat)');
  }

  async _teardown(reason) {
    const lend = this._lend;
    if (!lend) return;
    this._lend = null;
    this._stopWatchdog();
    this._vram.release(RpcLendingService.LEND_SERVER_ID);
    console.log(`[sharing] GPU lend ended: ${reason}`);
    RpcChildTerminator.terminate(lend.child, { platform: this._platform, spawn: this._spawn });
    this._waiters.wakeAll();
  }

  _stopWatchdog() {
    if (!this._watchdog) return;
    clearInterval(this._watchdog);
    this._watchdog = null;
  }
}

module.exports = RpcLendingService;
