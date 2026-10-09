const path = require('path');
const ConfinedFile = require('./ConfinedFile');
const ExtensionAssetGate = require('./ExtensionAssetGate');

class StaticUiRoutes {
  static MODAL_FILE = 'luma-modal.js';

  static LLM_UI_LIBS = [
    [/^\/llm-ui\/lib\/monaco\//, /^\/llm-ui\/lib\/monaco\/?/, ['monaco-editor', 'min', 'vs']],
    [/^\/llm-ui\/lib\/chart\//, /^\/llm-ui\/lib\/chart\/?/, ['chart.js', 'dist']],
    [/^\/llm-ui\/lib\/phaser\//, /^\/llm-ui\/lib\/phaser\/?/, ['phaser', 'dist']],
  ];

  constructor({ app, guard, rootDir, extensionManager }) {
    this._app = app;
    this._guard = guard;
    this._rootDir = rootDir;
    this._extensions = extensionManager;
  }

  mount() {
    this._mountLlmUi();
    this._mountDashboardUi();
  }

  _mountLlmUi() {
    const shellUiDir = this._dir('core', 'shell', 'ui');
    this._app.get(`/llm-ui/${StaticUiRoutes.MODAL_FILE}`, this._guard, (_req, res) => {
      ConfinedFile.send(res, shellUiDir, path.join(shellUiDir, StaticUiRoutes.MODAL_FILE));
    });
    for (const [route, prefix, parts] of StaticUiRoutes.LLM_UI_LIBS) {
      this._app.get(route, this._guard, ConfinedFile.handler(this._dir('node_modules', ...parts), prefix));
    }
    this._app.get(/^\/llm-ui\/ext\//, this._guard, new ExtensionAssetGate(this._extensions).handler());
    this._app.get(/^\/llm-ui\//, this._guard, ConfinedFile.handler(this._dir('core', 'llm-server', 'ui'), /^\/llm-ui\/?/, { fallback: 'llm-tab.html' }));
  }

  _mountDashboardUi() {
    this._app.get(/^\/dashboard-ui\/lib\/gridstack\//, this._guard, ConfinedFile.handler(this._dir('node_modules', 'gridstack', 'dist'), /^\/dashboard-ui\/lib\/gridstack\/?/));
    this._app.get(/^\/dashboard-ui\//, this._guard, ConfinedFile.handler(this._dir('core', 'dashboard', 'ui'), /^\/dashboard-ui\/?/, { fallback: 'dashboard.html' }));
  }

  _dir(...parts) {
    return path.join(this._rootDir, ...parts);
  }
}

module.exports = StaticUiRoutes;
