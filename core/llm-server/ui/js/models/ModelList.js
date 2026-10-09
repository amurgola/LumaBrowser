import ResonantRuntime from '../resonant/ResonantRuntime.js';
import LibraryScan from './LibraryScan.js';
import ModelListController from './ModelListController.js';

export default class ModelList {
  static LLM_LIST_NS = 'mlLlmRows';

  static INTERACTIVE = 'button, a, select, input, label';

  static _controllers = new WeakMap();

  static _namespaces = new WeakMap();

  static mount(mountEl, ns, opts) {
    if (!mountEl) return null;
    const existing = ModelList._controllers.get(mountEl);
    if (existing) return existing;
    const options = opts || {};
    const resonant = options.resonant || ResonantRuntime.shared();
    ModelList._registerToggle(resonant);
    ModelList._ensureArray(resonant, ns);
    ModelList._appendTemplateMount(mountEl, ns);
    const controller = new ModelListController(resonant, ns);
    ModelList._wireActions(mountEl, controller, options);
    ModelList._wireChanges(mountEl, controller, options);
    ModelList._controllers.set(mountEl, controller);
    ModelList._mountLibraryScan(mountEl, ns, options);
    return controller;
  }

  static mountLibraryScan(mountEl, opts) {
    return LibraryScan.mount(mountEl, opts);
  }

  static _registerToggle(resonant) {
    resonant.handler('mltoggle', (item, event) => {
      try {
        const target = event && event.target;
        if (target && target.closest && target.closest(ModelList.INTERACTIVE)) return;
        item.expanded = !item.expanded;
      } catch (_) {}
    });
  }

  static _ensureArray(resonant, ns) {
    let added = ModelList._namespaces.get(resonant);
    if (!added) { added = new Set(); ModelList._namespaces.set(resonant, added); }
    if (added.has(ns)) return;
    resonant.add(ns, []);
    added.add(ns);
  }

  static _appendTemplateMount(mountEl, ns) {
    const inner = document.createElement('div');
    inner.setAttribute('res', ns);
    inner.setAttribute('res-use', 'mlRow');
    mountEl.appendChild(inner);
  }

  static _wireActions(mountEl, controller, options) {
    mountEl.addEventListener('click', (event) => {
      const btn = event.target.closest('[data-ml-act]');
      if (!btn || !mountEl.contains(btn)) return;
      const row = controller.getRow(ModelList._keyOf(btn));
      if (typeof options.onAction === 'function') options.onAction(row, btn.getAttribute('data-ml-act'), event, btn);
    });
  }

  static _wireChanges(mountEl, controller, options) {
    mountEl.addEventListener('change', (event) => {
      const control = event.target.closest('[data-ml-change], .img-quant-sel');
      if (!control || !mountEl.contains(control)) return;
      const row = controller.getRow(ModelList._keyOf(control));
      if (typeof options.onChange === 'function') options.onChange(row, control, event);
    });
  }

  static _keyOf(element) {
    return element.getAttribute('data-key') || element.getAttribute('data-id') || '';
  }

  static _mountLibraryScan(mountEl, ns, options) {
    const wanted = options.libraryScan || (options.libraryScan !== false && ns === ModelList.LLM_LIST_NS);
    if (!wanted) return;
    LibraryScan.mount(mountEl, typeof options.libraryScan === 'object' && options.libraryScan ? options.libraryScan : {});
  }
}
