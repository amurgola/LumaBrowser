const IpcEnvelope = require('../../../shared/ipc/IpcEnvelope');

class WorkspaceFileIpcHandlers {
  static PREFIX = 'core.llmServer.chat.workspace.';

  static register(ipcMain, workspaceFiles) {
    const handle = (name, fn) => ipcMain.handle(WorkspaceFileIpcHandlers.PREFIX + name, WorkspaceFileIpcHandlers._guarded(fn));
    handle('info', (id) => workspaceFiles.info(id));
    handle('list', (id, a) => workspaceFiles.listDir(id, a.dir || ''));
    handle('read', (id, a) => workspaceFiles.readFile(id, a.path));
    handle('write', (id, a) => workspaceFiles.writeFile(id, a.path, a.content));
    handle('create', (id, a) => workspaceFiles.createEntry(id, a.path, a.kind));
    handle('rename', (id, a) => workspaceFiles.renameEntry(id, a.path, a.to));
    handle('remove', (id, a) => workspaceFiles.removeEntry(id, a.path));
  }

  static _guarded(fn) {
    return IpcEnvelope.enveloped((_event, args) => {
      const a = args || {};
      if (!a.conversationId) throw new Error('conversationId is required');
      return fn(String(a.conversationId), a);
    });
  }
}

module.exports = WorkspaceFileIpcHandlers;
