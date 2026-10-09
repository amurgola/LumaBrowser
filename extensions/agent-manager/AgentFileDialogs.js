const fs = require('fs');

class AgentFileDialogs {
  static KB_EXTENSIONS = ['pdf', 'txt', 'md', 'markdown', 'html', 'htm'];

  constructor(manager, dialog = null) {
    this._manager = manager;
    this._dialog = dialog;
  }

  async exportToFile(agent) {
    const res = await this._electronDialog().showSaveDialog({
      title: `Export agent "${agent.name}"`,
      defaultPath: agent.name.replace(/[<>:"/\\|?*]+/g, '_') + '.agent.json',
      filters: [{ name: 'Luma agent', extensions: ['json'] }],
    });
    if (res.canceled || !res.filePath) return { canceled: true };
    const bundle = this._manager.bundles.export(agent);
    fs.writeFileSync(res.filePath, JSON.stringify(bundle, null, 2), 'utf8');
    return { canceled: false, filePath: res.filePath, documents: bundle.knowledgeBase.documents.length };
  }

  async importFromFile() {
    const res = await this._electronDialog().showOpenDialog({
      title: 'Import agent',
      properties: ['openFile'],
      filters: [{ name: 'Luma agent', extensions: ['json'] }],
    });
    if (res.canceled || !res.filePaths.length) return { canceled: true };
    return { canceled: false, ...this._manager.bundles.import(AgentFileDialogs._readBundle(res.filePaths[0])) };
  }

  async addKnowledge(agent) {
    const knowledge = this._manager.knowledge;
    knowledge.requireRag();
    const res = await this._electronDialog().showOpenDialog({
      title: `Add knowledge documents to "${agent.name}"`,
      properties: ['openFile', 'multiSelections'],
      filters: [{ name: 'Documents', extensions: AgentFileDialogs.KB_EXTENSIONS }],
    });
    if (res.canceled || !res.filePaths.length) return { canceled: true, results: [], documents: knowledge.documents(agent.id) };
    const results = await knowledge.ingest(agent.id, res.filePaths);
    return { canceled: false, results, documents: knowledge.documents(agent.id) };
  }

  static _readBundle(filePath) {
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (e) {
      throw new Error('Could not read that file as an agent export: ' + e.message);
    }
  }

  _electronDialog() {
    return this._dialog || require('electron').dialog;
  }
}

module.exports = AgentFileDialogs;
