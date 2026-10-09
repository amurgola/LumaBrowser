class SharedGpuLease {
  static NOT_HOLDER = { status: 403, body: { error: 'This GPU lease belongs to another peer' } };

  constructor(service) {
    this._service = service;
  }

  gate() {
    if (!this._service.getShareFlags().shareGpus) return { status: 403, body: { error: 'GPU sharing is disabled on the host' } };
    if (!this._service.getRpcLending()) return { status: 503, body: { error: 'GPU lending is not available on the host' } };
    return null;
  }

  async acquire(credential, { devices } = {}, bindAddress) {
    const result = await this._service.getRpcLending().acquire({ devices, holder: SharedGpuLease.holderOf(credential), holderId: SharedGpuLease.idOf(credential), bindAddress });
    if (!result.success) return { status: result.busy ? 409 : 500, body: { error: result.error, busy: !!result.busy } };
    return { status: 200, body: { port: result.port, devices: result.devices, leaseMs: result.leaseMs, devicesInfo: result.devicesInfo || null } };
  }

  heartbeat(credential) {
    const result = this._service.getRpcLending().heartbeatFor(SharedGpuLease.idOf(credential));
    if (result.notHolder) return SharedGpuLease.NOT_HOLDER;
    if (!result.success) return { status: 410, body: { error: 'No active GPU lease' } };
    return { status: 200, body: { leaseMs: result.leaseMs } };
  }

  async release(credential) {
    const result = await this._service.getRpcLending().releaseFor(SharedGpuLease.idOf(credential));
    if (result && result.notHolder) return SharedGpuLease.NOT_HOLDER;
    return { status: 200, body: { success: true } };
  }

  static idOf(credential) {
    return (credential && credential.id) || null;
  }

  static holderOf(credential) {
    return (credential && (credential.peerHint || credential.label)) || 'peer';
  }
}

module.exports = SharedGpuLease;
