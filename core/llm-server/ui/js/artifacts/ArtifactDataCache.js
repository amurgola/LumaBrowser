export default class ArtifactDataCache {
  static PREFIX = 'luma.ad.';

  static read(rootId) {
    try {
      const raw = localStorage.getItem(ArtifactDataCache.PREFIX + rootId);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || typeof parsed.rev !== 'number') return null;
      return { rev: parsed.rev, data: (parsed.data && typeof parsed.data === 'object') ? parsed.data : {} };
    } catch (_) {
      return null;
    }
  }

  static write(rootId, rev, data) {
    try { localStorage.setItem(ArtifactDataCache.PREFIX + rootId, JSON.stringify({ rev, data })); } catch (_) {}
  }
}
