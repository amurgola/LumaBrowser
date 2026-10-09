class LedgerCards {
  static fromLedger(ledger) {
    const watched = new Set();
    const loading = new Set();
    const stamps = new Map();
    for (const claim of Object.values(ledger || {})) {
      if (!claim || !Array.isArray(claim.devices)) continue;
      for (const device of claim.devices) {
        if (!Number.isInteger(device) || device < 0) continue;
        watched.add(device);
        if (claim.resident !== true) loading.add(device);
        stamps.set(device, Math.max(stamps.get(device) || 0, Number(claim.ts) || 0));
      }
    }
    return { watched, loading, stamps };
  }
}

module.exports = LedgerCards;
