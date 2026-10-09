class VramLedger {
  constructor() {
    this._claims = new Map();
  }

  set(serverId, claim) {
    this._claims.set(serverId, claim);
  }

  get(serverId) {
    return this._claims.get(serverId);
  }

  delete(serverId) {
    this._claims.delete(serverId);
  }

  snapshot() {
    const out = {};
    for (const [id, claim] of this._claims) out[id] = { ...claim, devices: claim.devices.slice() };
    return out;
  }

  debitMap(excludeServerId) {
    const debit = new Map();
    for (const [id, claim] of this._claims) {
      if (id === excludeServerId || !VramLedger._debits(claim)) continue;
      VramLedger._addClaim(debit, claim);
    }
    return debit;
  }

  static applyDebit(devices, debit) {
    return devices.map((d) => ({
      ...d,
      freeBytes: d.freeBytes != null ? Math.max(0, d.freeBytes - (debit.get(d.index) || 0)) : d.freeBytes,
    }));
  }

  static _debits(claim) {
    return !!claim && Array.isArray(claim.devices) && claim.devices.length > 0 && !claim.resident;
  }

  static _addClaim(debit, claim) {
    const bytes = Number(claim.bytes) || 0;
    const weights = Array.isArray(claim.weights) && claim.weights.length === claim.devices.length ? claim.weights : null;
    claim.devices.forEach((idx, i) => {
      const share = weights ? bytes * weights[i] : bytes / claim.devices.length;
      debit.set(idx, (debit.get(idx) || 0) + share);
    });
  }
}

module.exports = VramLedger;
