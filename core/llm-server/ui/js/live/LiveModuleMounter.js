import HtmlEscaper from '../format/HtmlEscaper.js';
import ResonantRuntime from '../resonant/ResonantRuntime.js';
import ChartLoader from './ChartLoader.js';
import LiveModuleSource from './LiveModuleSource.js';

export default class LiveModuleMounter {
  static async mount(root, spec) {
    if (!root || root.dataset.mounted === '1') return;
    root.dataset.mounted = '1';
    try {
      await LiveModuleMounter._mountInto(root, spec || {});
    } catch (e) {
      LiveModuleMounter._showError(root, e);
    }
  }

  static polyfillElementFinders(el) {
    if (el && typeof el.getElementById !== 'function') {
      el.getElementById = (id) => el.querySelector('#' + ((window.CSS && CSS.escape) ? CSS.escape(String(id)) : String(id)));
    }
  }

  static async _mountInto(root, { html, js, libs, store, luma }) {
    root.innerHTML = html != null ? String(html) : '';
    const chart = await LiveModuleMounter._chartFor(root, libs);
    if (chart.failed) return;
    LiveModuleMounter.polyfillElementFinders(root);
    const R = ResonantRuntime.isLoaded() ? ResonantRuntime.scoped(root) : null;
    const jsText = js != null ? String(js) : '';
    if (jsText) await LiveModuleMounter._run(jsText, root, R, chart.lib, store, luma);
  }

  static async _chartFor(root, libs) {
    const list = Array.isArray(libs) ? libs : [];
    if (!list.some((lib) => /chart/i.test(String(lib)))) return { lib: undefined, failed: false };
    try {
      return { lib: await ChartLoader.ensure(), failed: false };
    } catch (err) {
      LiveModuleMounter._showError(root, err);
      return { lib: undefined, failed: true };
    }
  }

  static async _run(jsText, root, R, ChartLib, store, luma) {
    const ownStore = LiveModuleSource.declaresOwnStore(jsText);
    const ownLuma = LiveModuleSource.declaresOwnName(jsText, 'luma');
    const useStore = store && !ownStore ? store : null;
    const useLuma = luma && !ownLuma ? luma : null;
    const params = ['root', 'R', 'Chart'];
    const args = [root, R, ChartLib];
    if (!ownStore) { params.push('store'); args.push(useStore); }
    if (!ownLuma) { params.push('luma'); args.push(useLuma); }
    if (useStore || useLuma) {
      const fn = new Function(...params, 'return (async () => {\n' + jsText + '\n})();');
      await fn(...args);
    } else {
      new Function(...params, jsText)(...args);
    }
  }

  static _showError(root, err) {
    root.insertAdjacentHTML('beforeend',
      '<pre class="cm-live-err">' + HtmlEscaper.escapeText(String((err && err.message) || err)) + '</pre>');
  }
}
