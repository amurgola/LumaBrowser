const path = require('path');
const PathPicker = require('../../shared/ipc/PathPicker');
const AttachmentReader = require('./AttachmentReader');

class ChatAttachments {
  static DROP_MAX_FILES = 20;

  constructor({ reader = new AttachmentReader(), pickPath = PathPicker.pick } = {}) {
    this._reader = reader;
    this._pickPath = pickPath;
  }

  async pick(event) {
    const picked = await this._pickPath(event, { title: 'Attach a file to this chat', properties: ['openFile', 'multiSelections'], filters: ChatAttachments.filters() }, { useFocusedWindow: true });
    if (picked.canceled) return { canceled: true, files: [] };
    return { files: await this._reader.read(picked.paths) };
  }

  async readDropped(paths) {
    return { files: await this._reader.read(ChatAttachments.acceptedPaths(paths)) };
  }

  static acceptedPaths(paths) {
    return (Array.isArray(paths) ? paths : [])
      .filter((p) => typeof p === 'string' && p && path.isAbsolute(p))
      .slice(0, ChatAttachments.DROP_MAX_FILES);
  }

  static filters() {
    const bare = (exts) => [...exts].map((e) => e.replace(/^\./, ''));
    return [
      { name: 'Text / code', extensions: bare(AttachmentReader.TEXT_EXTS) },
      { name: 'Images', extensions: bare(AttachmentReader.IMAGE_EXTS) },
      { name: 'PDF (text not yet extracted)', extensions: ['pdf'] },
      { name: 'All files', extensions: ['*'] },
    ];
  }
}

module.exports = ChatAttachments;
