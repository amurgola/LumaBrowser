export default class LandingStarts {
  static MAX = 6;
  static MAX_TABS = 2;

  static build({ tabs = [], conversations = [], seeds = [], now = Date.now() } = {}) {
    const cards = [];
    for (const tab of LandingStarts.webTabs(tabs).slice(0, LandingStarts.MAX_TABS)) {
      cards.push({ kind: 'tab', title: tab.title || LandingStarts.host(tab.url), desc: 'Ask about ' + LandingStarts.host(tab.url), favicon: tab.favicon || '', tab });
    }
    const last = LandingStarts.lastConversation(conversations);
    if (last) {
      cards.push({ kind: 'conversation', title: last.title || 'Untitled chat', desc: 'Pick up where you left off, ' + LandingStarts.ago(last.updatedAt, now), id: last.id });
    }
    for (const [label, , seed, desc] of seeds) {
      if (cards.length >= LandingStarts.MAX) break;
      cards.push({ kind: 'seed', title: label, desc: desc || '', seed });
    }
    return cards.slice(0, LandingStarts.MAX);
  }

  static webTabs(tabs) {
    return (tabs || []).filter((t) => t && /^https?:\/\//i.test(t.url || '') && !/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//i.test(t.url));
  }

  static lastConversation(conversations) {
    let best = null;
    for (const c of conversations || []) {
      if (!c || c.parentConversationId) continue;
      if (!best || String(c.updatedAt || '') > String(best.updatedAt || '')) best = c;
    }
    return best;
  }

  static host(url) {
    try { return new URL(url).hostname.replace(/^www\./, ''); } catch (_) { return url || ''; }
  }

  static ago(iso, now = Date.now()) {
    const t = Date.parse(iso || '');
    if (!Number.isFinite(t)) return 'earlier';
    const min = Math.max(0, Math.round((now - t) / 60000));
    if (min < 1) return 'just now';
    if (min < 60) return min + (min === 1 ? ' minute ago' : ' minutes ago');
    const hours = Math.round(min / 60);
    if (hours < 24) return hours + (hours === 1 ? ' hour ago' : ' hours ago');
    const days = Math.round(hours / 24);
    if (days === 1) return 'yesterday';
    if (days < 7) return days + ' days ago';
    return 'on ' + new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
}
