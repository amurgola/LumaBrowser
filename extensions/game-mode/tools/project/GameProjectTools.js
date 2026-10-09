const GameToolScope = require('../GameToolScope');
const ReadBudget = require('./ReadBudget');
const ProjectOverviewTool = require('./ProjectOverviewTool');
const ReadFileTool = require('./ReadFileTool');
const GrepTool = require('./GrepTool');
const FindTool = require('./FindTool');
const ListDirTool = require('./ListDirTool');
const EditFileTool = require('./EditFileTool');
const WriteFileTool = require('./WriteFileTool');

class GameProjectTools {
  static TOOL_CLASSES = [ProjectOverviewTool, ReadFileTool, GrepTool, FindTool, ListDirTool, EditFileTool, WriteFileTool];

  static build({ truncator, wholeFileMaxBytes = 0, ctxPerSlot = 0, ...scopeFields }) {
    const scope = new GameToolScope(scopeFields);
    const budget = { truncator, wholeFileMaxBytes, wholeReadChars: ReadBudget.wholeReadChars(ctxPerSlot, truncator && truncator.maxBytes) };
    return GameProjectTools.TOOL_CLASSES.map((ToolClass) => GameProjectTools._tallied(new ToolClass(scope, budget).toDefinition(), scope));
  }

  static _tallied(def, scope) {
    return {
      ...def,
      handler: async (...args) => {
        const res = await def.handler(...args);
        GameProjectTools._tally(scope, res);
        return res;
      },
    };
  }

  static _tally(scope, res) {
    try {
      const s = scope.existingSession();
      if (s && res && typeof res.message === 'string') s.served += res.message.length;
    } catch (_) {}
  }
}

module.exports = GameProjectTools;
