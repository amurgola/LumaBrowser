const FakeBridgeLink = require('./FakeBridgeLink');

class ScenarioLink extends FakeBridgeLink {
  constructor({ scenario, pressApprove }) {
    super();
    this._scenario = scenario;
    this._pressApprove = pressApprove;
    this.decision = null;
    this.turnDone = new Promise((r) => { this._finished = r; });
  }

  async send(type, payload) {
    if (type === 'hello') return this._ready(payload);
    if (type === 'list-agents') return this._agents();
    if (type === 'approve') { this.decision = payload.decision; return undefined; }
    if (type === 'prompt') return this._play();
    return undefined;
  }

  async _ready(payload) {
    const s = this._scenario;
    await FakeBridgeLink.sleep(60);
    this.push('ready', { conversationId: 'conv_storefront', agent: s.AGENT, model: s.MODEL, root: payload.cwd, resumedMessages: 0, approval: payload.approval });
  }

  _agents() {
    const s = this._scenario;
    this.push('agents', { agents: [{ id: s.AGENT.id, name: s.AGENT.name, description: 'Reviews diffs and fixes what it finds.', model: s.MODEL, tools: 9, kbDocs: 0 }] });
  }

  async _play() {
    for (const [wait, kind, payload] of this._scenario.timeline()) {
      await FakeBridgeLink.sleep(wait);
      if (kind === '@approve') await this._approve();
      else if (kind !== '@edited') this.push(kind, payload);
    }
    this._finished();
  }

  async _approve() {
    this._pressApprove();
    while (!this.decision) await FakeBridgeLink.sleep(20);
  }
}

module.exports = ScenarioLink;
