export default class ChartLoader {
  static SRC = '/llm-ui/lib/chart/chart.umd.min.js';

  static _loading = null;

  static ensure() {
    if (typeof window.Chart === 'function') return Promise.resolve(window.Chart);
    if (!ChartLoader._loading) ChartLoader._loading = ChartLoader._load();
    return ChartLoader._loading;
  }

  static _load() {
    return new Promise((resolve, reject) => {
      const restore = ChartLoader._hideAmd();
      const script = document.createElement('script');
      script.src = ChartLoader.SRC;
      script.onload = () => {
        restore();
        if (typeof window.Chart === 'function') resolve(window.Chart);
        else reject(new Error('Chart.js loaded but its global was not set'));
      };
      script.onerror = () => {
        restore();
        ChartLoader._loading = null;
        reject(new Error('Chart.js could not be loaded: restart the app if you just updated.'));
      };
      document.head.appendChild(script);
    });
  }

  static _hideAmd() {
    const savedDefine = window.define;
    const hide = savedDefine && savedDefine.amd;
    if (hide) { try { window.define = undefined; } catch (_) {} }
    return () => { if (hide) { try { window.define = savedDefine; } catch (_) {} } };
  }

  static reset() {
    ChartLoader._loading = null;
  }
}
