const electron = require('electron');
const fs = require('fs');
const path = require('path');
const ConversationExportData = require('../chat/ConversationExportData');
const ConversationExportHtml = require('../chat/ConversationExportHtml');
const ConversationExportRenderer = require('../chat/ConversationExportRenderer');

class ConversationExporter {
  static UNKNOWN_FORMAT = 'Unknown export format.';
  static NOT_FOUND = 'Conversation not found.';

  constructor({
    llmServerService, deps, electronApi = electron, buildHtml = (data) => ConversationExportHtml.build(data),
    renderer = null, writeFile = fs.writeFileSync, log = console,
  }) {
    this._svc = llmServerService;
    this._deps = deps;
    this._electron = electronApi;
    this._buildHtml = buildHtml;
    this._renderer = renderer;
    this._writeFile = writeFile;
    this._log = log;
  }

  async export(event, conversationId, kind) {
    const k = String(kind || '').toLowerCase();
    if (!ConversationExportRenderer.KINDS.has(k)) return { success: false, error: ConversationExporter.UNKNOWN_FORMAT };
    const conversation = this._conversation(conversationId);
    if (!conversation) return { success: false, error: ConversationExporter.NOT_FOUND };
    let picked;
    try {
      picked = await this._pickDestination(event, conversation, k);
    } catch (err) {
      return { success: false, error: err.message };
    }
    if (!picked || picked.canceled || !picked.filePath) return { success: false, canceled: true };
    return this._renderTo(picked.filePath, conversation, conversationId, k);
  }

  _conversation(id) {
    try {
      return this._svc.chatStore.getConversation(id);
    } catch (_) {
      return null;
    }
  }

  _pickDestination(event, conversation, k) {
    const options = {
      title: 'Download as ' + k.toUpperCase(),
      defaultPath: path.join(this._downloadsDir(), ConversationExportRenderer.defaultFileName(conversation.title, k)),
      filters: k === 'pdf' ? [{ name: 'PDF document', extensions: ['pdf'] }] : [{ name: 'PNG image', extensions: ['png'] }],
    };
    const win = this._senderWindow(event);
    return win ? this._electron.dialog.showSaveDialog(win, options) : this._electron.dialog.showSaveDialog(options);
  }

  async _renderTo(filePath, conversation, conversationId, k) {
    try {
      const html = this._buildHtml(this._exportData(conversation, conversationId));
      const bytes = await this._rendererInstance().render(html, k);
      this._writeFile(filePath, bytes);
      return { success: true, path: filePath };
    } catch (err) {
      this._log.error('[llm-chat] conversation export failed:', err && err.message);
      return { success: false, error: err.message };
    }
  }

  _exportData(conversation, conversationId) {
    const artifactStore = this._deps.artifactStore();
    return ConversationExportData.build({
      conversation,
      messages: this._svc.chatStore.listActiveMessages(conversationId),
      artifacts: artifactStore ? artifactStore.list(conversationId) : [],
      getArtifact: artifactStore ? (id) => artifactStore.get(id) : null,
    });
  }

  _rendererInstance() {
    if (!this._renderer) this._renderer = new ConversationExportRenderer();
    return this._renderer;
  }

  _senderWindow(event) {
    try {
      return (event && event.sender && this._electron.BrowserWindow.fromWebContents(event.sender)) || null;
    } catch (_) {
      return null;
    }
  }

  _downloadsDir() {
    try {
      return this._electron.app.getPath('downloads');
    } catch (_) {
      return '';
    }
  }
}

module.exports = ConversationExporter;
