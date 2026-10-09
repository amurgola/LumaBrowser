export default class PageState {
  constructor() {
    this.status = 'offline';
    this.statusMessage = '';
    this.agent = null;
    this.model = null;
    this.root = '';
    this.approval = 'ask';
    this.streaming = false;
    this.showReasoning = false;
    this.suggest = true;
    this.context = [];
    this.agents = [];
    this.conversationId = null;
    this.resumedMessages = 0;
    this.ideName = 'IDE';
    this.turn = PageState.freshTurn();
  }

  static freshTurn() {
    return { tool: null, pendingTool: null, startedAt: 0, lastDecision: null, followupsQueued: 0, stopping: false };
  }
}
