const ToolResultSpill = require('../ToolResultSpill');
const WorkspaceFiles = require('../WorkspaceFiles');

class RunResultSpill {
  static create(router, conversationId, turnId) {
    if (!conversationId) return null;
    const workspaceRoot = RunResultSpill._workspaceRoot(router, conversationId);
    try {
      return ToolResultSpill.createWriter({ conversationId, turnId, workspaceRoot });
    } catch (_) {
      return null;
    }
  }

  static _workspaceRoot(router, conversationId) {
    try {
      const info = router && router.chatStore ? new WorkspaceFiles({ chatRouter: router }).resolveRoot(conversationId) : null;
      return info ? info.root : null;
    } catch (_) {
      return null;
    }
  }
}

module.exports = RunResultSpill;
