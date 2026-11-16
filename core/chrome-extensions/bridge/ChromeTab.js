class ChromeTab {
  static PRIVATE_FIELDS = ['url', 'title'];

  static fromWebContents(wc, facts = {}) {
    const active = !!facts.active;
    return {
      id: wc.id,
      index: Number.isInteger(facts.index) ? Math.max(0, facts.index) : 0,
      windowId: Number.isInteger(facts.windowId) ? facts.windowId : 0,
      groupId: -1,
      active,
      highlighted: active,
      selected: active,
      pinned: !!facts.pinned,
      incognito: !!facts.incognito,
      discarded: false,
      autoDiscardable: true,
      audible: ChromeTab._quiet(() => wc.isCurrentlyAudible(), false),
      mutedInfo: { muted: ChromeTab._quiet(() => wc.isAudioMuted(), false) },
      url: ChromeTab._quiet(() => wc.getURL(), ''),
      title: ChromeTab._quiet(() => wc.getTitle(), ''),
      status: ChromeTab._quiet(() => (wc.isLoading() ? 'loading' : 'complete'), 'complete'),
    };
  }

  static withoutPrivateFields(tab) {
    const copy = { ...tab };
    for (const field of ChromeTab.PRIVATE_FIELDS) delete copy[field];
    return copy;
  }

  static _quiet(read, fallback) {
    try { return read(); } catch (_) { return fallback; }
  }
}

module.exports = ChromeTab;
