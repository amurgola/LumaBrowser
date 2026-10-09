class CdpTarget {
  constructor({ targetId, type, tabId, url, title, browserContextId }) {
    this.targetId = targetId;
    this.type = type;
    this.tabId = tabId;
    this.url = url || '';
    this.title = title || '';
    this.browserContextId = browserContextId || null;
    this.attached = false;
  }

  toInfo() {
    return {
      targetId: this.targetId,
      type: this.type,
      title: this.title,
      url: this.url,
      attached: this.attached,
      browserContextId: this.browserContextId || undefined,
      canAccessOpener: false,
    };
  }
}

module.exports = CdpTarget;
