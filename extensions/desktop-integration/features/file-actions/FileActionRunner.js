const FileActionCatalog = require('./FileActionCatalog');
const FileText = require('./FileText');
const KnowledgeFiles = require('./KnowledgeFiles');

class FileActionRunner {
  static CHAT = {
    'describe-image': { prompt: 'promptDescribe', autoSend: true, detail: 'Describing the image in the chat' },
    'ask-image': { prompt: 'promptAskImage', autoSend: false, detail: 'Opened the chat with the image attached' },
    'edit-image': { prompt: 'promptEditImage', autoSend: false, detail: 'Opened the chat with the image attached to edit' },
    summarize: { prompt: 'promptSummarize', autoSend: true, detail: 'Summarizing in the chat' },
    'ask-file': { prompt: 'promptAskFile', autoSend: false, detail: 'Opened the chat with the file attached' },
    'ask-files': { prompt: 'promptAskFiles', autoSend: false, detail: 'Opened the chat with the files attached' },
  };

  constructor({ deps, env, setting, notify = () => {}, fileText = FileText, knowledgeFiles = KnowledgeFiles }) {
    this._deps = deps;
    this._env = env;
    this._setting = setting;
    this._notify = notify;
    this._fileText = fileText;
    this._knowledgeFiles = knowledgeFiles;
  }

  start(action, items, source) {
    const chat = FileActionRunner.CHAT[action.id];
    let detail;
    let work;
    if (chat) {
      detail = chat.detail;
      work = () => this._chat(chat, items, source);
    } else if (action.id === 'read-aloud') {
      detail = `Reading ${items[0].name} aloud`;
      work = () => this._readAloud(items[0]);
    } else if (FileActionCatalog.agentIdOf(action.id)) {
      detail = `Adding to the knowledge base (${action.label})`;
      work = () => this._addToKnowledge(FileActionCatalog.agentIdOf(action.id), action, items);
    } else {
      return { started: false, detail: 'Unknown action' };
    }
    const done = Promise.resolve()
      .then(work)
      .catch((err) => ({ success: false, error: (err && err.message) || String(err) }))
      .then((outcome) => this._finish(action, items, outcome));
    return { started: true, detail, done };
  }

  async _chat(chat, items, source) {
    const prompt = FileActionRunner.fill(this._setting(chat.prompt), items);
    const attachments = items.map((it) => ({ kind: 'file', path: it.path, name: it.name }));
    const result = await this._deps.handoff.open({ prompt, attachments, autoSend: chat.autoSend, source });
    if (result && result.success && !result.attached) return { success: false, error: FileActionRunner._rejected(result) };
    return result || { success: false, error: 'The chat did not answer' };
  }

  async _readAloud(item) {
    const text = await this._fileText.extract(item);
    if (!text) return { success: false, error: `${item.name} has no readable text` };
    return this._deps.speech.speak(text);
  }

  async _addToKnowledge(agentId, action, items) {
    const { files, skipped, truncated } = await this._knowledgeFiles.collect(items, { maxFiles: this._setting('kbMaxFiles') });
    if (!files.length) return { success: false, error: 'No Markdown, text, HTML or PDF files found to add' };
    const results = await this._env.ingest(agentId, files);
    const failed = (results || []).filter((r) => !r || !r.success).length;
    const added = files.length - failed;
    const notes = [];
    if (failed) notes.push(`${failed} failed`);
    if (skipped) notes.push(`${skipped} skipped`);
    if (truncated) notes.push(`stopped at ${files.length} files`);
    const summary = `${added} of ${files.length} document(s) added${notes.length ? ` (${notes.join(', ')})` : ''}`;
    return { success: added > 0, added, failed, skipped, truncated, summary, error: added > 0 ? undefined : summary, notifyAlways: true, label: action.label };
  }

  _finish(action, items, outcome) {
    const result = outcome || { success: false, error: 'No result' };
    const payload = { action: action.id, count: items.length, success: !!result.success, error: result.error || null, summary: result.summary || null };
    try { this._deps.broadcast('run', payload); } catch (_) {}
    if (!result.success) this._deps.log.warn(`${action.id} failed: ${result.error}`);
    if (this._setting('notifyResults') && (!result.success || result.notifyAlways)) {
      const title = result.success ? (result.label || action.label) : `Luma: ${action.label} failed`;
      try { this._notify(title, result.success ? result.summary : String(result.error || 'Failed')); } catch (_) {}
    }
    return result;
  }

  static fill(template, items) {
    const names = items.map((it) => it.name);
    return String(template == null ? '' : template)
      .replace(/\{name\}/g, names[0] || '')
      .replace(/\{names\}/g, names.join(', '))
      .replace(/\{count\}/g, String(items.length));
  }

  static _rejected(result) {
    const list = Array.isArray(result.rejected) ? result.rejected : [];
    return list.length ? list.map((r) => `${r.name}: ${r.error}`).join('; ') : 'Nothing could be attached';
  }
}

module.exports = FileActionRunner;
