export default class AgentEventReducer {
  static apply(msg, p) {
    const payload = p || {};
    const run = AgentEventReducer._runFor(msg, payload);
    const handler = AgentEventReducer.PHASES[payload.phase];
    if (handler) handler(run, payload);
    return run;
  }

  static _runFor(msg, p) {
    if (!msg.agentRuns) msg.agentRuns = [];
    const id = p.invocationId || 'agent';
    let run = msg.agentRuns.find((r) => r.invocationId === id);
    if (!run) {
      run = { invocationId: id, agentName: p.agentName || 'Agent', thinking: '', body: '', steps: [], done: false, error: null, conversationId: null };
      msg.agentRuns.push(run);
    }
    if (p.conversationId) run.conversationId = p.conversationId;
    return run;
  }

  static _tool(run, p) {
    const t = p.tool || {};
    const pend = run.steps.find((x) => x.pending);
    if (t.phase === 'pending') {
      if (!pend) run.steps.push({ tool: t.tool || null, status: 'run', pending: true });
      else if (t.tool) pend.tool = t.tool;
    } else if (t.phase === 'run') {
      if (!pend) { run.steps.push({ tool: t.tool, status: 'run' }); return; }
      pend.tool = t.tool || pend.tool;
      delete pend.pending;
    } else if (t.phase === 'cancel') {
      run.steps = run.steps.filter((x) => !x.pending);
    } else if (t.phase === 'done') {
      const s = [...run.steps].reverse().find((x) => x.tool === t.tool && x.status === 'run');
      if (!s) return;
      s.status = t.success ? 'ok' : 'err';
      delete s.pending;
    }
  }

  static PHASES = {
    start: (run, p) => { if (p.agentName) run.agentName = p.agentName; },
    reasoning: (run, p) => { run.thinking += (p.text || ''); },
    delta: (run, p) => { run.body += (p.text || ''); },
    rollback: (run, p) => {
      const n = Math.min(Number(p.chars) || 0, run.body.length);
      if (n) run.body = run.body.slice(0, run.body.length - n);
    },
    tool: AgentEventReducer._tool,
    done: (run) => { run.done = true; },
    error: (run, p) => { run.done = true; run.error = p.message || 'agent error'; },
  };
}
