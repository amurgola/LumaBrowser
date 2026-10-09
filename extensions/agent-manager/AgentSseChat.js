const ArtifactSummary = require('./ArtifactSummary');

class AgentSseChat {
  constructor(runTurn) {
    this._runTurn = runTurn;
  }

  async respond(agent, body, req, res) {
    const message = body.message || body.prompt;
    if (!message) return res.status(400).json({ success: false, error: 'message is required' });
    const turn = { agent, messages: [{ role: 'user', content: String(message) }], images: Array.isArray(body.images) ? body.images : [] };
    if (body.stream === false) return this._json(agent, turn, res);
    return this._stream(agent, turn, req, res);
  }

  async _json(agent, turn, res) {
    const { text, error, artifacts } = await this._runTurn(turn);
    if (error) return res.status(500).json({ success: false, error });
    return res.json({ success: true, agent: agent.name, response: text, artifacts: ArtifactSummary.list(artifacts) });
  }

  async _stream(agent, turn, req, res) {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive' });
    const write = (obj) => { try { res.write('data: ' + JSON.stringify(obj) + '\n\n'); } catch (_) {} };
    const controller = new AbortController();
    req.on('close', () => { try { controller.abort(); } catch (_) {} });
    const { text, error, artifacts } = await this._runTurn({
      ...turn, emit: (p) => AgentSseChat._event(p, agent, write), signal: controller.signal,
    });
    if (error) write({ object: 'agent.error', error });
    else write({ object: 'agent.done', response: text, artifacts: ArtifactSummary.list(artifacts) });
    try { res.write('data: [DONE]\n\n'); } catch (_) {}
    res.end();
  }

  static _event(p, agent, write) {
    if (!p) return;
    if (p.phase === 'delta') write({ object: 'agent.delta', delta: p.text || '' });
    else if (p.phase === 'reasoning') write({ object: 'agent.reasoning', delta: p.text || '' });
    else if (p.phase === 'tool') write({ object: 'agent.tool', tool: p.tool || null });
    else if (p.phase === 'artifact') write({ object: 'agent.artifact', artifact: ArtifactSummary.of(p.artifact) });
    else if (p.phase === 'start') write({ object: 'agent.start', agent: agent.name });
  }
}

module.exports = AgentSseChat;
