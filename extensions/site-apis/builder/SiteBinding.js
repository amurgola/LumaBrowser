const BuilderMeta = require('./BuilderMeta');

class SiteBinding {
  static resolve(service, conversationId, data = {}) {
    if (!service) return { site: null, patch: {} };
    let site = data.siteId ? service.getSite(data.siteId) : null;
    if (!site && data.partition && data.origin) site = SiteBinding._findOrCreate(service, conversationId, data);
    if (!site) return { site: null, patch: data.siteId ? { siteId: null } : {} };
    if (site.conversationId !== conversationId && conversationId) {
      try { site = service.updateSite(site.id, { conversationId }) || site; } catch (_) {}
    }
    const patch = { siteId: site.id, partition: site.partition, origin: site.origin };
    if (!data.startUrl) patch.startUrl = site.startUrl;
    return { site, patch };
  }

  static _findOrCreate(service, conversationId, data) {
    const origin = BuilderMeta.originOf(data.origin) || BuilderMeta.originOf(data.startUrl);
    if (!origin) return null;
    const existing = service.store && typeof service.store.findSite === 'function'
      ? service.store.findSite({ partition: data.partition, origin })
      : null;
    if (existing) return existing;
    return service.createSite({
      name: data.name || new URL(origin).hostname.replace(/^www\./, ''),
      origin,
      partition: data.partition,
      startUrl: data.startUrl || origin,
      conversationId,
    });
  }
}

module.exports = SiteBinding;
