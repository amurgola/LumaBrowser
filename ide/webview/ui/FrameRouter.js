import AgentBlock from './AgentBlock.js';

export default class FrameRouter {
  constructor(page) {
    this._page = page;
    this._agentRow = null;
    this._byType = this._handlers();
  }

  route(type, payload) {
    if (!Object.prototype.hasOwnProperty.call(this._byType, type)) return;
    this._byType[type](payload || {});
  }

  _handlers() {
    const page = this._page;
    return {
      meta: (p) => { if (p.conversationId) page.state.conversationId = p.conversationId; },
      status: (p) => this._onStatus(p),
      delta: (p) => { if (p.text) { page.transcript.setStatus(null); page.answers.pushAnswer(p.text); } },
      'reasoning-delta': (p) => this._onReasoning(p),
      rollback: (p) => page.answers.rollback(p.chars),
      tool: (p) => this._onTool(p),
      'command:output': (p) => this._onCommandOutput(p),
      artifact: (p) => { page.answers.sealAnswer(); page.transcript.artifact(p.title, p.type); },
      agent: (p) => this._onAgent(p),
      queued: (p) => { page.state.turn.followupsQueued = p.pending || 0; },
      'followup-start': (p) => { page.state.turn.followupsQueued = p.pending || 0; page.beginTurn(p.text, []); },
      busy: (p) => this._onBusy(p),
      'bridge-error': (p) => this._onBridgeError(p),
      done: (p) => this._onDone(p),
      error: (p) => this._onError(p),
      suggest: (p) => this._onSuggest(p),
      'open-in-app-result': (p) => { if (!p.ok) page.composer.flashHint('Could not reach the LumaBrowser chat window.'); },
    };
  }

  _onStatus(p) {
    if (p.phase === 'compacted') { this._page.transcript.note('history compacted'); return; }
    this._page.transcript.setStatus(this._page.grammar.statusText(p));
  }

  _onReasoning(p) {
    if (!p.text) return;
    const chars = this._page.answers.appendReasoning(p.text);
    this._page.transcript.setStatus('thinking · ' + this._page.grammar.fmtTokens(chars) + ' chars');
  }

  _onCommandOutput(p) {
    const tool = this._page.state.turn.tool;
    if (tool && tool.tool === 'run_command' && !tool.done && p.chunk) tool.appendOutput(p.chunk);
  }

  _onBusy(p) {
    this._page.transcript.note(p.message || 'LumaBrowser is busy with another chat turn.', 'warn');
    if (this._page.state.streaming) this._page.endTurn();
  }

  _onBridgeError(p) {
    const page = this._page;
    if (page.state.streaming) {
      page.answers.sealAnswer();
      page.answers.sealReasoning();
      page.transcript.error(p.message || 'bridge error');
      page.endTurn();
    } else if (p.code !== 'no-agent') {
      page.transcript.note('LumaBrowser: ' + (p.message || 'bridge error'), 'bad');
    }
  }

  _onError(p) {
    const page = this._page;
    page.answers.sealAnswer();
    page.answers.sealReasoning();
    const tool = page.state.turn.tool;
    if (tool && !tool.done) tool.finish({ success: false, error: 'interrupted' });
    page.transcript.error(p.message || 'unknown error');
    page.endTurn();
  }

  _onSuggest(p) {
    const page = this._page;
    if (!page.state.streaming && page.state.suggest && p.text && !page.approval.isOpen()) page.composer.setSuggestion(p.text);
  }

  _onTool(p) {
    if (!p || !p.phase) return;
    const page = this._page;
    const turn = page.state.turn;
    switch (p.phase) {
      case 'pending':
        turn.pendingTool = p.tool;
        page.transcript.setStatus(page.grammar.pendingText(p));
        break;
      case 'run': this._onToolRun(p); break;
      case 'done': case 'result':
        if (turn.tool && !turn.tool.done) turn.tool.finish({ success: p.success, error: p.error, summary: p.summary });
        break;
      case 'cancel': turn.pendingTool = null; page.transcript.setStatus(null); break;
      case 'approval': page.approval.show(p); break;
      case 'approval-done': this._onApprovalDone(p); break;
      default: break;
    }
  }

  _onToolRun(p) {
    const page = this._page;
    const turn = page.state.turn;
    page.answers.sealAnswer();
    page.answers.sealReasoning();
    turn.pendingTool = null;
    page.transcript.setStatus(null);
    if (turn.tool && !turn.tool.done) turn.tool.finish({ success: true });
    turn.tool = page.newToolBlock(p.tool, p.params);
    if (turn.lastDecision && turn.lastDecision.tool === p.tool) {
      turn.tool.decision = turn.lastDecision.decision;
      turn.lastDecision = null;
    }
  }

  _onApprovalDone(p) {
    const page = this._page;
    const turn = page.state.turn;
    page.approval.hide();
    turn.lastDecision = { tool: p.tool, decision: p.decision };
    if (p.decision !== 'reject' && p.decision !== 'timeout') return;
    const row = page.newToolBlock(p.tool, page.approval.lastParams || null);
    row.decision = 'reject';
    row.finish({ success: true, error: p.decision === 'timeout' ? 'no answer in time' : null });
    turn.lastDecision = null;
  }

  _onAgent(p) {
    if (!p) return;
    const page = this._page;
    if (p.phase === 'start' || !this._agentRow || this._agentRow.done) {
      page.answers.sealAnswer();
      this._agentRow = new AgentBlock(page.transcript, page.grammar, p.agentName || p.name);
      if (p.phase === 'start') return;
    }
    const row = this._agentRow;
    if (p.phase === 'delta' || p.phase === 'reasoning') { row.chars += (p.text || '').length; row.paint(); }
    else if (p.phase === 'tool') { if (p.tool && p.tool.phase === 'run') { row.tools += 1; row.paint(); } }
    else if (p.phase === 'done') row.finish(null);
    else if (p.phase === 'error') row.finish(p.error || p.message || 'failed');
  }

  _onDone(p) {
    const page = this._page;
    const turn = page.state.turn;
    page.answers.sealAnswer();
    page.answers.sealReasoning();
    const aborted = !!p.aborted || p.finishReason === 'abort' || p.stopReason === 'aborted';
    if (turn.tool && !turn.tool.done) turn.tool.finish({ success: !aborted, error: aborted ? 'stopped' : null });
    const usage = p.usage || null;
    page.transcript.summary({
      aborted,
      iterations: p.iterations,
      tokens: usage && usage.total_tokens,
      secs: turn.startedAt ? (Date.now() - turn.startedAt) / 1000 : null,
      tps: p.timings && p.timings.predicted_per_second ? Number(p.timings.predicted_per_second) : null,
    });
    page.endTurn();
  }
}
