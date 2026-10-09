import MonacoDiagnostics from './MonacoDiagnostics.js';
import MonacoThemes from './MonacoThemes.js';

export default class MonacoLoader {
  static VS_ROOT = '/llm-ui/lib/monaco';

  static LOADER_SRC = MonacoLoader.VS_ROOT + '/loader.js';

  static _loading = null;

  static ensureLoaded() {
    if (!MonacoLoader._loading) MonacoLoader._loading = MonacoLoader._load();
    return MonacoLoader._loading;
  }

  static _load() {
    return new Promise((resolve, reject) => {
      if (window.monaco && window.monaco.editor) {
        resolve(window.monaco);
        return;
      }
      const script = document.createElement('script');
      script.src = MonacoLoader.LOADER_SRC;
      script.async = true;
      script.onload = () => MonacoLoader._requireEditor(resolve, reject);
      script.onerror = () => reject(new Error('Failed to fetch Monaco loader from ' + MonacoLoader.LOADER_SRC));
      document.head.appendChild(script);
    });
  }

  static _requireEditor(resolve, reject) {
    try {
      if (!window.require || !window.require.config) {
        reject(new Error('Monaco loader exposed no AMD require()'));
        return;
      }
      window.require.config({ paths: { vs: MonacoLoader.VS_ROOT } });
      window.require(['vs/editor/editor.main'], () => MonacoLoader._ready(resolve, reject), (err) => reject(err));
    } catch (err) {
      reject(err);
    }
  }

  static _ready(resolve, reject) {
    if (!window.monaco) {
      reject(new Error('Monaco loaded but window.monaco missing'));
      return;
    }
    try { MonacoThemes.define(window.monaco); } catch (_) {}
    try { MonacoDiagnostics.configure(window.monaco); } catch (_) {}
    resolve(window.monaco);
  }

  static reset() {
    MonacoLoader._loading = null;
  }
}
