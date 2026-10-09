const AgentToolCatalog = require('../../../../llm-service/AgentToolCatalog');
const TokenEstimator = require('../../../../shared/text/TokenEstimator');
const AgentRunner = require('../../../agent/AgentRunner');
const AvailableGroups = require('../groups/AvailableGroups');
const SystemPromptAppend = require('./SystemPromptAppend');
const VisionHint = require('./VisionHint');

class PreviewSystemPrompt {
  static TAB_INFO = '(none: preview; the live value is the user\'s active tab URL + title)';
  static CUSTOM_PROMPT_SETTING = 'aiChat.systemPrompt';

  constructor(router) {
    this._router = router;
  }

  build({ deps, modelRef = null, allowedTools = null, modeSystemPrompt = null, withImages = 0 } = {}) {
    if (!deps) throw new Error('agent deps unavailable (browser/extensions not ready)');
    const db = deps.db || null;
    const allowList = Array.isArray(allowedTools) ? allowedTools : null;
    const allows = (name) => !allowList || allowList.includes(name);
    const extTools = deps.mcpAggregator ? AgentToolCatalog.getDynamicTools(deps.mcpAggregator).filter((t) => allows(t.name)) : [];
    const groups = AvailableGroups.for(allows, extTools, { kbHasDocs: AvailableGroups.knowledgeBaseHasDocs(deps.ragService) });
    const visionHint = VisionHint.forTurn(withImages > 0 ? withImages : 0, this._visionActive(modelRef));
    const append = SystemPromptAppend.build({ allows, extTools, groups, visionHint, modeSystemPrompt, activeGroups: new Set() });
    const prompt = PreviewSystemPrompt._agent(deps, db).buildSystemPrompt({
      tabInfo: PreviewSystemPrompt.TAB_INFO,
      defaultTabId: 0,
      allowedTools: allowList,
      systemPromptAppend: append,
    });
    return {
      prompt,
      chars: prompt.length,
      tokensEstimate: TokenEstimator.estimateTokens(prompt),
      toolCount: allowList ? allowList.length : null,
      extTools: extTools.map((t) => t.name),
      segments: PreviewSystemPrompt._segments({ db, groups, extTools, visionHint, modeSystemPrompt }),
    };
  }

  _visionActive(modelRef) {
    const router = this._router;
    return !!(router && router.modelVisionActive && router.modelVisionActive(modelRef));
  }

  static _agent(deps, db) {
    return new AgentRunner({ browserTools: null }, { browserService: deps.browserService }, db);
  }

  static _segments({ db, groups, extTools, visionHint, modeSystemPrompt }) {
    const userCustom = db ? db.get(PreviewSystemPrompt.CUSTOM_PROMPT_SETTING, '') : '';
    return [
      { key: 'base', label: 'Base assistant identity & rules', present: true },
      { key: 'tabState', label: 'Active tab state', present: true },
      { key: 'browserTools', label: 'Browser tool definitions', present: true },
      { key: 'dateTime', label: 'Live date & time', present: true },
      { key: 'toolRegistry', label: 'Inactive tool registry (activate_tools)', present: groups.length > 0 },
      { key: 'artifactTools', label: 'Artifact tools (lazy)', present: false },
      { key: 'liveArtifactTool', label: 'Live artifact tool (lazy)', present: false },
      { key: 'imageTools', label: 'Image tools (lazy)', present: false },
      { key: 'validateTool', label: 'Code validation (lazy)', present: false },
      { key: 'extTools', label: `Extension / MCP tools (lazy, ${extTools.length})`, present: false },
      { key: 'visionHint', label: 'Vision hint (image attached)', present: !!visionHint },
      { key: 'userCustom', label: 'Your custom system prompt', present: !!(userCustom && userCustom.trim()) },
      { key: 'mode', label: 'Active chat-mode prompt', present: !!modeSystemPrompt },
    ];
  }
}

module.exports = PreviewSystemPrompt;
