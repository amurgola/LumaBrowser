export default class TriggerCardData {
  static DELIVERY_LIMIT = 5;

  static async load(api, conversationId) {
    if (!api || !api.triggers || !conversationId) return null;
    const hit = (await TriggerCardData._list(api)).find((t) => t.conversationId === conversationId);
    if (!hit) return null;
    try {
      const g = await api.triggers.get(hit.id);
      if (g && g.success && g.trigger) {
        return { trigger: { ...g.trigger, runCount: hit.runCount || 0 }, details: await TriggerCardData._details(api, hit.id, g) };
      }
    } catch (_) {}
    return { trigger: hit, details: null };
  }

  static async _list(api) {
    try {
      const r = await api.triggers.list();
      return (r && r.success && r.triggers) || [];
    } catch (_) {
      return [];
    }
  }

  static async _details(api, id, g) {
    return {
      baseUrls: g.baseUrls || null,
      watch: g.watch || null,
      secret: g.secret || null,
      pending: g.pending || null,
      versions: g.versions || null,
      agent: g.agent || null,
      deliveries: await TriggerCardData._deliveries(api, id),
    };
  }

  static async _deliveries(api, id) {
    try {
      const d = await api.triggers.deliveries(id, { limit: TriggerCardData.DELIVERY_LIMIT });
      return (d && d.success && d.deliveries) || [];
    } catch (_) {
      return [];
    }
  }
}
