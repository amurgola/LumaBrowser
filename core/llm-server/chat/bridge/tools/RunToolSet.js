const AgentToolCatalog = require('../../../../llm-service/AgentToolCatalog');
const ApprovalGate = require('../../ApprovalGate');
const ToolAdmission = require('../../ToolAdmission');
const ToolRequiredArgs = require('../../ToolRequiredArgs');
const BridgeGlobals = require('../BridgeGlobals');
const AvailableGroups = require('../groups/AvailableGroups');
const ToolGroupState = require('../groups/ToolGroupState');
const ExtraTools = require('./ExtraTools');

class RunToolSet {
  static VISION_ONLY_TOOLS = new Set(['screenshot', 'click_at']);
  static ACTIVATE_TOOLS = 'activate_tools';
  static TAKEOVER_TOOL = 'ask_user_takeover';

  constructor({ router, deps, modelRef, allowedTools = null, extraTools = null, refreshAllowedTools = null, kbScope = null, conversationId = null }) {
    this.visionActive = !!(router && router.modelVisionActive && router.modelVisionActive(modelRef));
    this.mcpAggregator = (deps && deps.mcpAggregator) || null;
    this._allowList = Array.isArray(allowedTools) ? [...allowedTools] : null;
    this._refreshAllowedTools = refreshAllowedTools;
    this.allows = (name) => this._allows(name);
    this.injected = ExtraTools.normalize(extraTools);
    this.extTools = this.mcpAggregator ? AgentToolCatalog.getDynamicTools(this.mcpAggregator).filter((t) => this.allows(t.name)) : [];
    this.extToolNames = new Set(this.extTools.map((t) => t.name));
    this.allExtTools = [...this.extTools, ...this.injected.defs];
    this._indexTools();
    this.kbScope = (typeof kbScope === 'string' && kbScope) ? kbScope : AvailableGroups.DEFAULT_KB_SCOPE;
    this.groups = new ToolGroupState({
      allows: this.allows,
      extTools: this.allExtTools,
      kbHasDocs: AvailableGroups.knowledgeBaseHasDocs(deps && deps.ragService, this.kbScope),
      chatStore: (router && router.chatStore) || null,
      conversationId,
      forcedActive: this.injected.defs.map((d) => d.name),
    });
    this._liveRunTools = null;
  }

  runToolList({ allowTakeover = false } = {}) {
    let names = this._allowList ? [...this._allowList] : undefined;
    if (!this.visionActive) {
      names = (names || [...new Set([...AgentToolCatalog.getAllToolNames(this.mcpAggregator), ...this.allExtTools.map((t) => t.name)])])
        .filter((n) => !RunToolSet.VISION_ONLY_TOOLS.has(n));
    }
    if (names) names = [...new Set([...names, RunToolSet.ACTIVATE_TOOLS, ...(allowTakeover ? [RunToolSet.TAKEOVER_TOOL] : [])])];
    this._liveRunTools = names || null;
    return names;
  }

  admitCatalogChanges() {
    const policy = this._freshPolicy();
    if (policy === undefined) return [];
    const { admitted } = ToolAdmission.admitNewTools({
      dynamicTools: AgentToolCatalog.getDynamicTools(this.mcpAggregator),
      known: this.extToolNames,
      policy,
    });
    if (!admitted.length) return [];
    for (const tool of admitted) this._admit(tool);
    this._indexTools();
    this.groups.refresh(this.allows, this.allExtTools);
    this.groups.activate(this.groups.keysOwning(admitted.map((t) => t.name)));
    return admitted;
  }

  _allows(name) {
    if (RunToolSet.VISION_ONLY_TOOLS.has(name) && !this.visionActive) return false;
    if (name === 'locate' && !BridgeGlobals.groundingAvailable()) return false;
    return !this._allowList || this._allowList.includes(name);
  }

  _indexTools() {
    this.requiredArgs = new ToolRequiredArgs(this.allExtTools);
    this.mutatingDeclared = ApprovalGate.mutatingNamesOf(this.allExtTools);
  }

  _freshPolicy() {
    if (typeof this._refreshAllowedTools !== 'function' || !this.mcpAggregator) return undefined;
    try {
      const policy = this._refreshAllowedTools();
      return policy === undefined ? null : policy;
    } catch (_) {
      return undefined;
    }
  }

  _admit(tool) {
    this.extTools.push(tool);
    this.allExtTools.push(tool);
    this.extToolNames.add(tool.name);
    if (this._allowList && !this._allowList.includes(tool.name)) this._allowList.push(tool.name);
    if (this._liveRunTools && !this._liveRunTools.includes(tool.name)) this._liveRunTools.push(tool.name);
  }
}

module.exports = RunToolSet;
