class ShellPageScripts {
  static BOUNDS_MODULE = 'ui/shell/layout/ViewBoundsReporter.js';

  static installLongTaskObserver = () => {
    window.__perfLongTasks = [];
    new PerformanceObserver((list) => window.__perfLongTasks.push(
      ...list.getEntries().map((e) => ({ start: e.startTime, duration: e.duration })),
    )).observe({ type: 'longtask', buffered: true });
  };

  static installBoundsHook = async (modulePath) => {
    try {
      const Reporter = (await import(new URL(modulePath, document.baseURI).href)).default;
      const original = Reporter && Reporter.prototype && Reporter.prototype.computeBounds;
      if (typeof original !== 'function') return false;
      const hook = { calculations: 0, calculationMs: 0, reporter: null };
      Reporter.prototype.computeBounds = function computeBounds(...args) {
        const start = performance.now();
        hook.calculations++;
        hook.reporter = this;
        try { return original.apply(this, args); } finally { hook.calculationMs += performance.now() - start; }
      };
      window.__lumaPerfBounds = hook;
      window.dispatchEvent(new Event('resize'));
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      return Boolean(hook.reporter);
    } catch (_) {
      return false;
    }
  };

  static measureBackgroundUpdates = async () => {
    const hook = window.__lumaPerfBounds;
    const host = document.querySelector('#settingsModal');
    if (!hook || !host) return { backgroundUpdates: 0, calculations: null, calculationMs: null, skipped: 'bounds hook or #settingsModal missing' };
    const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));
    const node = document.createElement('div');
    host.appendChild(node);
    await frame(); await frame();
    hook.calculations = 0; hook.calculationMs = 0;
    for (let i = 0; i < 60; i++) {
      node.textContent = `Background progress ${i}`;
      node.classList.toggle('updating', i % 2 === 0);
      await frame();
    }
    await frame();
    const result = { backgroundUpdates: 60, calculations: hook.calculations, calculationMs: hook.calculationMs };
    node.remove();
    return result;
  };

  static measureGeometry = async () => {
    const hook = window.__lumaPerfBounds;
    if (!hook || !hook.reporter || typeof openSettings !== 'function' || typeof closeSettings !== 'function') {
      return { skipped: 'bounds hook or openSettings/closeSettings missing' };
    }
    const settle = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const last = () => ({ ...hook.reporter.lastSent });
    openSettings();
    await settle();
    const modal = last();
    closeSettings();
    await settle();
    const restored = last();
    const dialog = document.createElement('div');
    dialog.className = 'lm-overlay';
    dialog.style.cssText = 'position:fixed;inset:0;z-index:99999';
    document.body.appendChild(dialog);
    await settle();
    const dynamicModal = last();
    dialog.remove();
    await settle();
    const afterRemove = last();
    const wrapper = document.createElement('div');
    const panel = document.createElement('div');
    panel.className = 'lm-overlay';
    panel.style.cssText = `position:fixed;top:${restored.y}px;right:0;bottom:0;left:auto;width:max-content;z-index:99999`;
    const child = document.createElement('div');
    child.style.width = '220px';
    panel.appendChild(child);
    wrapper.appendChild(panel);
    document.body.appendChild(wrapper);
    await settle(); await settle();
    const narrow = last();
    child.style.width = '320px';
    await settle(); await settle();
    const wider = last();
    wrapper.style.visibility = 'hidden';
    await settle();
    const hiddenByAncestor = last();
    wrapper.remove();
    await settle();
    return { modal, restored, dynamicModal, afterRemove, narrow, wider, hiddenByAncestor };
  };

  static measureTabSwitches = async () => {
    if (!window.tabAPI) return [];
    const activeEl = document.querySelector('.tab.active');
    const originalTab = activeEl ? Number(activeEl.dataset.tabId) : null;
    const first = await window.tabAPI.create('about:blank');
    const second = await window.tabAPI.create('about:blank');
    const samples = [];
    try {
      for (let i = 0; i < 12; i++) {
        const start = performance.now();
        await window.tabAPI.switch(i % 2 ? first.id : second.id);
        samples.push(performance.now() - start);
        await new Promise((resolve) => requestAnimationFrame(resolve));
      }
    } finally {
      if (originalTab != null && !Number.isNaN(originalTab)) await window.tabAPI.switch(originalTab);
      await window.tabAPI.close(first.id);
      await window.tabAPI.close(second.id);
    }
    return samples;
  };

  static readRendererTimings = () => ({
    paints: performance.getEntriesByType('paint').map((e) => ({ name: e.name, ms: e.startTime })),
    navigation: performance.getEntriesByType('navigation').map((e) => e.toJSON()),
    longTasks: window.__perfLongTasks,
  });
}

module.exports = ShellPageScripts;
