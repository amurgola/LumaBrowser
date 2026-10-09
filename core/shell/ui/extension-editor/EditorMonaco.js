export default class EditorMonaco {
  static VS_PATH = '../../node_modules/monaco-editor/min/vs';

  static EDITOR_OPTIONS = {
    theme: 'vs-dark',
    fontSize: 13,
    minimap: { enabled: false },
    automaticLayout: true,
    tabSize: 2,
    suggestOnTriggerCharacters: true,
    quickSuggestions: { other: true, comments: false, strings: false },
  };

  static LANGUAGES = { js: 'javascript', json: 'json', html: 'html', css: 'css', md: 'markdown' };

  static load(win) {
    const amdRequire = win.require;
    if (typeof amdRequire !== 'function' || typeof amdRequire.config !== 'function') {
      return Promise.reject(new Error('Monaco loader.js is not loaded'));
    }
    amdRequire.config({ paths: { vs: new URL(EditorMonaco.VS_PATH, win.location.href).href } });
    return new Promise((resolve, reject) => amdRequire(['vs/editor/editor.main'], (main) => resolve(win.monaco || main), reject));
  }

  static createEditor(monaco, container) {
    return monaco.editor.create(container, { ...EditorMonaco.EDITOR_OPTIONS });
  }

  static languageFor(fileName) {
    const ext = String(fileName).split('.').pop();
    return Object.prototype.hasOwnProperty.call(EditorMonaco.LANGUAGES, ext) ? EditorMonaco.LANGUAGES[ext] : 'plaintext';
  }
}
