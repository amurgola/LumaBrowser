const axios = require('axios');
const PinnedTls = require('../tls/PinnedTls');

class PeerApi {
  static PROBE_TIMEOUT_MS = 5000;
  static REQUEST_TIMEOUT_MS = 8000;
  static ACQUIRE_TIMEOUT_MS = 30000;
  static DEFAULT_LEASE_MS = 60000;

  static async info(base) {
    try {
      const res = await axios.get(`${base}/sharing/info`, PeerApi._options(base, { timeout: PeerApi.PROBE_TIMEOUT_MS }));
      if (res.status !== 200 || !res.data) return { success: false, error: `Not a LumaBrowser sharing host (HTTP ${res.status}).` };
      return { success: true, base, info: res.data };
    } catch (err) {
      return { success: false, error: (err && err.message) || 'Could not reach host.' };
    }
  }

  static async pair(base, pin, peerHint) {
    try {
      const res = await axios.post(`${base}/sharing/pair`, { pin: String(pin || ''), peerHint },
        PeerApi._options(base, { timeout: PeerApi.REQUEST_TIMEOUT_MS }));
      if (res.status !== 200 || !res.data || !res.data.token) {
        return { success: false, error: (res.data && res.data.error) || `Pairing failed (HTTP ${res.status}).` };
      }
      return { success: true, token: res.data.token };
    } catch (err) {
      return { success: false, error: (err && err.message) || 'Pairing request failed.' };
    }
  }

  static async fetchManifest(peer) {
    try {
      const res = await axios.get(`${peer.endpoint}/sharing/resources`, PeerApi._authorized(peer, PeerApi.REQUEST_TIMEOUT_MS));
      if (res.status === 401) return { success: false, error: 'Pairing token rejected. Re-pair with the PIN.' };
      if (res.status !== 200 || !res.data) return { success: false, error: `Could not read resources (HTTP ${res.status}).` };
      return { success: true, manifest: res.data };
    } catch (err) {
      return { success: false, error: (err && err.message) || 'Could not read resources.' };
    }
  }

  static async rpcAcquire(peer, devices) {
    try {
      const res = await axios.post(`${peer.endpoint}/sharing/rpc/acquire`, { devices }, PeerApi._authorized(peer, PeerApi.ACQUIRE_TIMEOUT_MS));
      if (res.status === 409) return { success: false, busy: true, error: (res.data && res.data.error) || 'Peer GPUs are busy.' };
      if (res.status !== 200 || !res.data || !res.data.port) {
        return { success: false, error: (res.data && res.data.error) || `GPU acquire failed (HTTP ${res.status}).` };
      }
      return PeerApi._lease(peer, res.data);
    } catch (err) {
      return { success: false, error: (err && err.message) || 'GPU acquire request failed.' };
    }
  }

  static async rpcHeartbeat(peer) {
    try {
      const res = await axios.post(`${peer.endpoint}/sharing/rpc/heartbeat`, {}, PeerApi._authorized(peer, PeerApi.REQUEST_TIMEOUT_MS));
      if (res.status === 410) return { success: false, gone: true };
      return { success: res.status === 200 };
    } catch (_) {
      return { success: false };
    }
  }

  static async rpcRelease(peer) {
    try {
      await axios.post(`${peer.endpoint}/sharing/rpc/release`, {}, PeerApi._authorized(peer, PeerApi.REQUEST_TIMEOUT_MS));
    } catch (_) {}
    return { success: true };
  }

  static _lease(peer, data) {
    return {
      success: true,
      addr: `${new URL(peer.endpoint).hostname}:${data.port}`,
      devices: data.devices || [],
      devicesInfo: Array.isArray(data.devicesInfo) ? data.devicesInfo : null,
      leaseMs: Number(data.leaseMs) || PeerApi.DEFAULT_LEASE_MS,
    };
  }

  static _authorized(peer, timeout) {
    return PeerApi._options(peer.endpoint, { timeout, headers: { Authorization: `Bearer ${peer.token}` } });
  }

  static _options(base, options) {
    const agent = base ? PinnedTls.agentFor(base) : null;
    return { ...options, validateStatus: () => true, ...(agent ? { httpsAgent: agent } : {}) };
  }
}

module.exports = PeerApi;
