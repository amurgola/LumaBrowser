const OnDemandPrompt = require('./OnDemandPrompt');
const OnDemandKnowledgeBase = require('./OnDemandKnowledgeBase');

class OnDemandMode {
  static MODE_ID = 'on-demand';
  static TEMPERATURE = 0.2;
  static MAX_ITERATIONS = 12;

  static ALLOWED_TOOLS = Object.freeze([
    'observe_page', 'click', 'click_at', 'locate', 'type', 'fill_form', 'press_key', 'scroll',
    'select_option', 'set_date', 'set_slider',
    'get_source', 'screenshot', 'wait_for', 'get_element', 'extract_data', 'collect_list',
    'navigate', 'get_tabs',
    'search_knowledge_base',
  ]);

  constructor(knowledgeBase) {
    this._knowledgeBase = knowledgeBase;
  }

  descriptor() {
    return {
      id: OnDemandMode.MODE_ID,
      label: 'Luma On Demand',
      description: 'The page assistant behind the floating Live panel: acts on the tab you are looking at.',
      requirements: ['llm'],
      hidden: true,
      agent: true,
      buildTurn: (args) => this.buildTurn(args),
    };
  }

  buildTurn({ meta, modelRef = null } = {}) {
    const data = (meta && meta.data) || {};
    const tabId = OnDemandMode._tabId(data.tabId);
    return {
      systemPrompt: OnDemandPrompt.build({ ...data, tabId }, { kbDocs: this._knowledgeBase.docCount() }),
      temperature: OnDemandMode.TEMPERATURE,
      agent: true,
      allowedTools: OnDemandMode.ALLOWED_TOOLS.slice(),
      workTabId: tabId,
      agentBudget: { maxIterations: OnDemandMode.MAX_ITERATIONS },
      kbScope: OnDemandKnowledgeBase.SCOPE,
      modelRef,
    };
  }

  static _tabId(value) {
    return Number.isFinite(Number(value)) ? Number(value) : null;
  }
}

module.exports = OnDemandMode;
