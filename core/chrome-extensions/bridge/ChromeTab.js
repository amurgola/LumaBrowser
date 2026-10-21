class ChromeTab {
  static fromWebContents(wc, entry = null, order = null) {
    const index = order && entry ? Math.max(0, order.indexOf(entry.id)) : 0;
    return {
      id: wc.id,
      index,
      windowId: 0,
      groupId: -1,
      active: !!(entry && entry.active),
      highlighted: !!(entry && entry.active),
      selected: !!(entry && entry.active),
      pinned: false,
      incognito: false,
      discarded: false,
      autoDiscardable: true,
      audible: ChromeTab._quiet(() => wc.isCurrentlyAudible(), false),
      mutedInfo: { muted: ChromeTab._quiet(() => wc.isAudioMuted(), false) },
      url: ChromeTab._quiet(() => wc.getURL(), ''),
      title: ChromeTab._quiet(() => wc.getTitle(), ''),
      status: ChromeTab._quiet(() => (wc.isLoading() ? 'loading' : 'complete'), 'complete'),
    };
  }

  static _quiet(read, fallback) {
    try { return read(); } catch (_) { return fallback; }
  }
}

module.exports = ChromeTab;
