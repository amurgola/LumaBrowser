export default class SystemStatus {
  static EVENT = 'luma-system-status';

  static UNFOLD_EVENT = 'luma-sys-unfold';

  static emit(doc, key, status) {
    if (!doc || !status) return;
    doc.dispatchEvent(new CustomEvent(SystemStatus.EVENT, { detail: { key, ...status } }));
  }

  static unfoldAround(el) {
    const card = el && el.closest && el.closest('[data-sys-fold]');
    if (card) card.dispatchEvent(new CustomEvent(SystemStatus.UNFOLD_EVENT, { bubbles: true }));
  }

  static error(text) {
    return { tone: 'attention', value: 'Could not load', title: text || '' };
  }

  static runtimes(store, chosenId = null) {
    const installed = store.installedInference();
    if (!installed.length) return { tone: 'attention', value: 'Not installed', title: 'No inference runtime is installed yet' };
    const names = installed.map((r) => r.name);
    const title = names.join(', ');
    if (installed.every((r) => SystemStatus._runtimeBroken(r))) return { tone: 'attention', value: 'Needs attention', title };
    const chosen = chosenId ? installed.find((r) => r.id === chosenId) : null;
    if (SystemStatus.updateNeedsAttention(installed, chosen, (id) => store.update(id))) {
      return { tone: 'attention', value: 'Update available', title };
    }
    if (chosen) return { tone: 'ok', value: chosen.name, title: names.length > 1 ? `In use; also installed: ${names.filter((n) => n !== chosen.name).join(', ')}` : title };
    const value = names.length === 1 ? names[0] : `${names[0]} and ${names.length - 1} more`;
    return { tone: 'ok', value, title };
  }

  static updateNeedsAttention(installed, chosen, updateOf) {
    const has = (r) => { const u = updateOf(r.id); return !!(u && u.updateAvailable); };
    return chosen ? has(chosen) : installed.some(has);
  }

  static _runtimeBroken(r) {
    if (r.probeError) return true;
    if (r.backend && r.backend.checked && r.backend.ok === false) return true;
    return !!(r.hardware && r.hardware.ready === false);
  }

  static models(config, scan) {
    const path = (config && config.effectivePath) || (scan && scan.dir) || '';
    if (!scan || !scan.available) return { tone: 'attention', value: 'Folder unavailable', title: (scan && scan.reason) || path };
    const n = (scan.models || []).length;
    if (!n) return { tone: 'attention', value: 'No models yet', title: path };
    const tail = SystemStatus.pathTail(path);
    return { tone: 'ok', value: `${n} ${n === 1 ? 'model' : 'models'}${tail ? ' in ' + tail : ''}`, title: path };
  }

  static pathTail(path) {
    const parts = String(path || '').split(/[\\/]+/).filter(Boolean);
    if (!parts.length) return '';
    const sep = String(path).includes('\\') ? '\\' : '/';
    return parts.slice(-2).join(sep);
  }

  static imageRuntimes(runtimes, updates, chosenId, progress) {
    const list = runtimes || [];
    const installed = list.filter((r) => r.installed);
    const slots = progress || {};
    const running = Object.keys(slots).filter((id) => slots[id] && slots[id].phase !== 'failed');
    if (running.length) return { tone: 'busy', value: 'Installing…', title: running.join(', ') };
    const failed = Object.keys(slots).find((id) => slots[id] && slots[id].phase === 'failed');
    if (failed) return { tone: 'attention', value: 'Install failed', title: slots[failed].error || '' };
    if (!installed.length) return { tone: 'attention', value: 'Not installed', title: 'No image runtime is installed yet' };
    const names = installed.map((r) => r.name);
    const chosen = chosenId ? installed.find((r) => r.id === chosenId) : null;
    if (SystemStatus.updateNeedsAttention(installed, chosen, (id) => updates && updates.get(id))) {
      return { tone: 'attention', value: 'Update available', title: names.join(', ') };
    }
    const value = chosen ? chosen.name : (names.length === 1 ? names[0] : `${names[0]} and ${names.length - 1} more`);
    return { tone: 'ok', value, title: names.join(', ') };
  }

  static imageModels(installed, config, error, activeDl) {
    const path = (config && config.effectivePath) || '';
    if (activeDl) return { tone: 'busy', value: 'Downloading…', title: activeDl.name || activeDl.id || '' };
    if (error) return { tone: 'attention', value: 'Download failed', title: error };
    const n = (installed || []).length;
    if (!n) return { tone: 'attention', value: 'No models yet', title: path };
    const tail = SystemStatus.pathTail(path);
    return { tone: 'ok', value: `${n} ${n === 1 ? 'model' : 'models'}${tail ? ' in ' + tail : ''}`, title: path };
  }

  static grounding(view, stateLabel, error) {
    if (!view) return { tone: 'off', value: 'Unavailable', title: '' };
    if (error || view.lastError || view.state === 'error') return { tone: 'attention', value: 'Problem', title: error || view.lastError || '' };
    if (!view.configured) return { tone: 'off', value: 'Not set up', title: 'Optional: lets the agent find controls on screenshots' };
    const state = (stateLabel[view.state] || view.state || '').toLowerCase();
    return { tone: 'ok', value: `${view.modelName || 'Configured'}${state ? ', ' + state : ''}`, title: view.modelPath || '' };
  }
}
