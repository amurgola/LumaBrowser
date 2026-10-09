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
      run = { invocationId: id, agentName: p.agentName || 'Agent', thinking: '', body: '', steps: [], done: false, error: null };
      msg.agentRuns.push(run);
    }
    return run;
  }

  static _tool(run, p) {
    const t = p.tool || {};
    if (t.phase === 'run' || t.phase === 'pending') {
      run.steps.push({ tool: t.tool, status: 'run' });
    } else if (t.phase === 'done') {
      const s = [...run.steps].reverse().find((x) => x.tool === t.tool && x.status === 'run');
      if (s) s.status = t.success ? 'ok' : 'err';
    }
  }

  static PHASES = {
    start: (run, p) => { if (p.agentName) run.agentName = p.agentName; },
    reasoning: (run, p) => { run.thinking += (p.text || ''); },
    delta: (run, p) => { run.body += (p.text || ''); },
    tool: AgentEventReducer._tool,
    done: (run) => { run.done = true; },
    error: (run, p) => { run.done = true; run.error = p.message || 'agent error'; },
  };
}
