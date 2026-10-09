export default class PanelSizeStore {
  static KEY = 'lumabrowser.panelSizes.v1';

  static read() {
    try {
      const raw = localStorage.getItem(PanelSizeStore.KEY);
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  }

  static write(sizes) {
    try { localStorage.setItem(PanelSizeStore.KEY, JSON.stringify(sizes)); } catch {}
  }

  static remember(storeKey, px) {
    const sizes = PanelSizeStore.read();
    sizes[storeKey] = px;
    PanelSizeStore.write(sizes);
  }

  static applyStored(panels) {
    const sizes = PanelSizeStore.read();
    for (const cfg of Object.values(panels)) {
      const v = sizes[cfg.storeKey];
      if (typeof v === 'number' && v > 0) document.documentElement.style.setProperty(cfg.cssVar, `${v}px`);
    }
  }
}
