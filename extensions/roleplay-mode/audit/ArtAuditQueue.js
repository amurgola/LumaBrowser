const RoleplayEnv = require('../images/RoleplayEnv');

class ArtAuditQueue {
  static CAP = 6;

  static enabled(data) {
    return ((data && data.options) || {}).artAudit !== false && RoleplayEnv.enabled('RP_ART_AUDIT');
  }

  static add(data, item) {
    if (!ArtAuditQueue.enabled(data)) return;
    data.pendingArtAudit = Array.isArray(data.pendingArtAudit) ? data.pendingArtAudit : [];
    const key = (x) => [x.kind, x.charId, x.outfitId || ''].join('|');
    if (data.pendingArtAudit.some((x) => key(x) === key(item))) return;
    data.pendingArtAudit.push(item);
    if (data.pendingArtAudit.length > ArtAuditQueue.CAP) {
      data.pendingArtAudit.splice(0, data.pendingArtAudit.length - ArtAuditQueue.CAP);
    }
  }
}

module.exports = ArtAuditQueue;
