const fs = require('fs');
const path = require('path');
const Slug = require('../../shared/text/Slug');

class ExtensionTemplate {
  constructor({ rootDir }) {
    this._rootDir = rootDir;
  }

  create(extName) {
    const id = Slug.from(extName);
    const extDir = path.join(this._rootDir, 'extensions', id);
    if (fs.existsSync(extDir)) return { success: false, error: `Extension directory "${id}" already exists` };
    fs.mkdirSync(extDir, { recursive: true });
    const name = String(extName);
    fs.writeFileSync(path.join(extDir, 'manifest.js'), ExtensionTemplate.manifest(id, name));
    fs.writeFileSync(path.join(extDir, 'main.js'), ExtensionTemplate.main(name));
    fs.writeFileSync(path.join(extDir, 'renderer.js'), ExtensionTemplate.renderer(id, name));
    return { success: true, extensionId: id, dir: extDir };
  }

  static manifest(id, name) {
    const quoted = ExtensionTemplate._quoted(name);
    return `module.exports = {
  id: '${id}',
  name: '${quoted}',
  version: '1.0.0',
  description: 'A custom LumaBrowser extension',

  dependencies: {
    required: {},
    optional: {}
  },

  ui: {
    'settings-tab': {
      label: '${quoted}',
      tabId: '${id}',
    }
  },

  main: './main.js',
  renderer: './renderer.js',
};
`;
  }

  static main(name) {
    return `/**
 * ${ExtensionTemplate._commentSafe(name)} Extension - Main Process
 */
module.exports = {
  async activate(context) {
    const { ipc, db, browser } = context;

    // Register IPC handlers here
    // ipc.handle('myAction', async (event, data) => { ... });

    // Return public API
    return {};
  },

  async deactivate() {
    // Cleanup
  },
};
`;
  }

  static renderer(id, name) {
    const className = `${name.replace(/[^a-zA-Z0-9]/g, '')}Renderer`;
    const quoted = ExtensionTemplate._quoted(name);
    return `/**
 * ${ExtensionTemplate._commentSafe(name)} Extension - Renderer
 */
(function() {
  'use strict';

  const SETTINGS_HTML = \`
    <div class="form-group">
      <p>Configure ${ExtensionTemplate._templateText(name)} here.</p>
    </div>
  \`;

  class ${className} {
    async activate(context) {
      context.slotManager.register('settings-tab', '${id}', SETTINGS_HTML, {
        label: '${quoted}',
        tabId: '${id}',
      });
    }
  }

  const instance = new ${className}();
  window.__ext_${id.replace(/-/g, '_')} = {
    activate: (context) => instance.activate(context),
  };
})();
`;
  }

  static _quoted(text) {
    return text.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\r?\n/g, ' ');
  }

  static _templateText(text) {
    return text.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
  }

  static _commentSafe(text) {
    return text.replace(/\*\//g, '* /').replace(/\r?\n/g, ' ');
  }
}

module.exports = ExtensionTemplate;
