const fs = require('fs');
const CoreRequire = require('../CoreRequire');

const ProjectContextFiles = CoreRequire.require('shell/ProjectContextFiles');
const ContainerFs = CoreRequire.require('shell/ContainerFs');

class ContextFilesBlock {
  static render(context, sessions, conversationId, data) {
    if (data && data.noContextFiles) return null;
    try {
      const s = sessions.get(conversationId);
      if (s && s.workspaceId && context.code && typeof context.code.contextFiles === 'function') {
        return ProjectContextFiles.render(context.code.contextFiles(s.workspaceId)) || null;
      }
      return ContextFilesBlock._fromSetupPath(data);
    } catch (_) {
      return null;
    }
  }

  static _fromSetupPath(data) {
    const projectPath = data && data.projectPath && String(data.projectPath).trim();
    if (!projectPath) return null;
    const collected = ProjectContextFiles.collect(projectPath, { fsOps: ContainerFs.routed(fs) });
    return ProjectContextFiles.render(collected) || null;
  }
}

module.exports = ContextFilesBlock;
