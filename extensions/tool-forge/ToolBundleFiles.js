const fs = require('fs');

class ToolBundleFiles {
  static FILTERS = [{ name: 'Luma tool', extensions: ['json'] }];

  constructor({ service, store, dialog, fileSystem = fs }) {
    this._service = service;
    this._store = store;
    this._dialog = dialog || null;
    this._fs = fileSystem;
  }

  async exportTool(name) {
    const tool = this._store.get(name);
    if (!tool) throw new Error('Tool not found');
    const choice = await this._dialogs().showSaveDialog({
      title: `Export tool "${tool.name}"`,
      defaultPath: ToolBundleFiles.fileNameFor(tool.name),
      filters: ToolBundleFiles.FILTERS,
    });
    if (choice.canceled || !choice.filePath) return { canceled: true };
    this._fs.writeFileSync(choice.filePath, JSON.stringify(this._service.exportBundle(tool.name), null, 2), 'utf8');
    return { canceled: false, filePath: choice.filePath };
  }

  async importTool() {
    const choice = await this._dialogs().showOpenDialog({ title: 'Import tool', properties: ['openFile'], filters: ToolBundleFiles.FILTERS });
    if (choice.canceled || !choice.filePaths.length) return { canceled: true };
    const { tool, warnings } = this._service.importBundle(this._readBundle(choice.filePaths[0]));
    return { canceled: false, name: tool.name, warnings };
  }

  static fileNameFor(toolName) {
    return toolName.replace(/[<>:"/\\|?*]+/g, '_') + '.tool.json';
  }

  _readBundle(filePath) {
    try {
      return JSON.parse(this._fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
      throw new Error('Could not read that file as a tool export: ' + error.message);
    }
  }

  _dialogs() {
    if (!this._dialog) this._dialog = require('electron').dialog;
    return this._dialog;
  }
}

module.exports = ToolBundleFiles;
