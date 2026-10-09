const CoreRequire = require('../../CoreRequire');
const ProjectWorkspace = require('./ProjectWorkspace');
const WholeReadGuard = require('./WholeReadGuard');
const ProjectOverviewTool = require('./ProjectOverviewTool');
const ReadFileTool = require('./ReadFileTool');
const GrepTool = require('./GrepTool');
const FindTool = require('./FindTool');
const ListDirTool = require('./ListDirTool');
const EditFileTool = require('./EditFileTool');
const WriteFileTool = require('./WriteFileTool');
const SaveArtifactTool = require('./SaveArtifactTool');
const RunCommandTool = require('./RunCommandTool');
const CheckProcessTool = require('./CheckProcessTool');

const ExtensionGlobals = CoreRequire.require('shell/extensions/ExtensionGlobals');

class ProjectTools {
  static create({ context, conversationId, meta, sessions, truncator, wholeFileMaxBytes = 0, ctxPerSlot = 0, artifacts = null }) {
    const workspace = new ProjectWorkspace({ code: context && context.code, sessions, conversationId, meta });
    const guard = new WholeReadGuard({ budgetChars: WholeReadGuard.budgetFor(ctxPerSlot, truncator && truncator.maxBytes) });
    const tools = ProjectTools._tools({ context, workspace, guard, truncator, wholeFileMaxBytes, artifacts });
    return tools.map((tool) => ProjectTools._tallied(tool, workspace));
  }

  static routerArtifactStore() {
    try {
      const router = ExtensionGlobals.chatRouter();
      const deps = router && typeof router.getAgentDeps === 'function' ? router.getAgentDeps() : null;
      return (deps && deps.artifactStore) || null;
    } catch (_) {
      return null;
    }
  }

  static _tools({ context, workspace, guard, truncator, wholeFileMaxBytes, artifacts }) {
    const getArtifactStore = () => artifacts || ProjectTools.routerArtifactStore();
    return [
      new ProjectOverviewTool({ workspace }),
      new ReadFileTool({ workspace, guard, truncator, wholeFileMaxBytes }),
      new GrepTool({ workspace, truncator }),
      new FindTool({ workspace, truncator }),
      new ListDirTool({ workspace }),
      new EditFileTool({ workspace }),
      new WriteFileTool({ workspace }),
      new SaveArtifactTool({ workspace, getArtifactStore }),
      new RunCommandTool({ workspace, truncator, db: context && context.db }),
      new CheckProcessTool({ workspace, truncator }),
    ].map((tool) => tool.toTool());
  }

  static _tallied(tool, workspace) {
    return {
      ...tool,
      handler: async (...args) => {
        const res = await tool.handler(...args);
        try { workspace.recordServed(res); } catch (_) {}
        return res;
      },
    };
  }
}

module.exports = ProjectTools;
