const AssistantBlock = require('../blocks/AssistantBlock');
const ReasoningBlock = require('../blocks/ReasoningBlock');
const ToolBlock = require('../blocks/ToolBlock');
const AgentBlock = require('../blocks/AgentBlock');
const ArtifactBlock = require('../blocks/ArtifactBlock');
const NoteBlock = require('../blocks/NoteBlock');
const ErrorBlock = require('../blocks/ErrorBlock');
const SummaryBlock = require('../blocks/SummaryBlock');
const ToolGrammar = require('../ToolGrammar');

class TurnFrames {
  constructor(app) {
    this.app = app;
  }

  handle(type, p) {
    const app = this.app;
    switch (type) {
      case 'meta': if (p.conversationId) app.conversationId = p.conversationId; break;
      case 'status': this._status(p); break;
      case 'delta': if (p.text) { app.turnStatus.clear(); app.rollback.push(p.text); } break;
      case 'reasoning-delta': this._reasoning(p.text); break;
      case 'rollback': this._rollback(p.chars); break;
      case 'tool': this._tool(p); break;
      case 'command:output': this._commandOutput(p); break;
      case 'artifact': this.sealAnswer(); app.push(new ArtifactBlock({ title: p.title, type: p.type })); break;
      case 'agent': this._agent(p); break;
      case 'queued': this._queued(p); break;
      case 'followup-start': app.followupsQueued = p.pending || 0; app.beginTurn(p.text); break;
      case 'busy': app.push(new NoteBlock(p.message || 'LumaBrowser is busy.', 'warn')); app.endTurn(false); break;
      case 'bridge-error': app.push(new NoteBlock(`bridge: ${p.message || 'unknown error'}`, 'bad')); if (app.streaming) app.endTurn(false); break;
      case 'done': this._done(p); break;
      case 'error': this._error(p); break;
      case 'suggest': if (!app.streaming && !app.approval && p.text) app.editor.setSuggestion(p.text); break;
      default: break;
    }
  }

  appendAnswer(text) {
    const app = this.app;
    if (!app.answer) {
      this.sealReasoning();
      app.answer = new AssistantBlock();
      app.blocks.push(app.answer);
    }
    app.answer.text += text;
  }

  sealAnswer() {
    const app = this.app;
    app.rollback.flush();
    if (app.answer) { app.answer.done = true; app.answer = null; }
  }

  sealReasoning() {
    const app = this.app;
    if (app.reasoning) { app.reasoning.done = true; app.reasoning.endedAt = app.now(); app.reasoning = null; }
  }

  _status(p) {
    const app = this.app;
    if (p && p.phase === 'compacted') {
      app.push(new NoteBlock(p.midTurn
        ? `earlier steps compacted to fit the context window${p.reason === 'overflow' ? ' (request overflowed)' : ''}`
        : 'history compacted'));
      if (p.midTurn) app.turnStatus.set({ kind: 'working' });
      return;
    }
    app.turnStatus.set({ text: ToolGrammar.statusText(p) });
  }

  _reasoning(text) {
    const app = this.app;
    if (!text) return;
    if (!app.reasoning) {
      this.sealAnswer();
      app.reasoning = new ReasoningBlock({ shown: app.showReasoning });
      app.reasoning.startedAt = app.now();
      app.blocks.push(app.reasoning);
    }
    app.reasoning.text += text;
    app.turnStatus.set({ kind: 'thinking' });
  }

  _rollback(chars) {
    const app = this.app;
    let n = Number(chars) || 0;
    const held = Math.min(n, app.rollback.pending.length);
    app.rollback.rollback(held);
    n -= held;
    if (n > 0 && app.answer) app.answer.text = n >= app.answer.text.length ? '' : app.answer.text.slice(0, -n);
  }

  _tool(p) {
    if (!p || !p.phase) return;
    switch (p.phase) {
      case 'pending': this._toolPending(p); break;
      case 'run': this._toolRun(p); break;
      case 'done': case 'result': this._toolDone(p); break;
      case 'cancel': this.app.pendingTool = null; this.app.turnStatus.clear(); break;
      case 'approval': this.app.askApproval(p); break;
      case 'approval-done': this._approvalDone(p); break;
      default: break;
    }
  }

  _toolPending(p) {
    this.app.pendingTool = p.tool;
    this.app.turnStatus.set({ text: ToolGrammar.pendingText(p) });
  }

  _toolRun(p) {
    const app = this.app;
    this.sealAnswer();
    this.sealReasoning();
    app.pendingTool = null;
    app.turnStatus.clear();
    const tb = new ToolBlock({ tool: p.tool, params: p.params });
    if (app.lastDecision && app.lastDecision.tool === p.tool) { tb.decision = app.lastDecision.decision; app.lastDecision = null; }
    app.blocks.push(tb);
  }

  _toolDone(p) {
    const open = this.app.blocks.filter((b) => b instanceof ToolBlock && !b.done);
    const tb = open.find((b) => b.tool === p.tool) || open[0];
    if (tb) tb.finish({ success: p.success, error: p.error, summary: p.summary });
  }

  _approvalDone(p) {
    const app = this.app;
    app.approval = null;
    app.lastDecision = { tool: p.tool, decision: p.decision };
    if (p.decision !== 'reject' && p.decision !== 'timeout') return;
    const tb = new ToolBlock({ tool: p.tool, params: app.lastApprovalParams || null });
    tb.decision = 'reject';
    tb.finish({ success: false, error: p.decision === 'timeout' ? 'no answer in time' : null });
    tb.success = true;
    app.blocks.push(tb);
    app.lastDecision = null;
  }

  _commandOutput(p) {
    const chunk = p && p.chunk;
    if (!chunk) return;
    const tb = TurnFrames._lastOpen(this.app.blocks, (b) => b instanceof ToolBlock && b.tool === 'run_command');
    if (tb) tb.appendOutput(chunk);
  }

  _agent(p) {
    if (!p) return;
    const app = this.app;
    let ab = TurnFrames._lastOpen(app.blocks, (b) => b instanceof AgentBlock);
    if (p.phase === 'start' || !ab) {
      this.sealAnswer();
      ab = new AgentBlock({ name: p.agentName || p.name });
      app.blocks.push(ab);
      if (p.phase === 'start') return;
    }
    TurnFrames._agentProgress(ab, p);
  }

  static _agentProgress(ab, p) {
    if (p.phase === 'delta' || p.phase === 'reasoning') ab.chars += (p.text || '').length;
    else if (p.phase === 'tool') { if (p.tool && p.tool.phase === 'run') ab.tools += 1; }
    else if (p.phase === 'done') ab.done = true;
    else if (p.phase === 'error') { ab.done = true; ab.error = p.error || p.message || 'failed'; }
  }

  _queued(p) {
    const app = this.app;
    app.followupsQueued = p.pending || 0;
    app.push(new NoteBlock(`queued ${app.followupsQueued} follow-up${app.followupsQueued === 1 ? '' : 's'}`));
  }

  _done(p) {
    const app = this.app;
    this.sealAnswer();
    this.sealReasoning();
    for (const b of app.blocks) if (b instanceof ToolBlock && !b.done) b.finish({ success: !p.aborted, error: p.aborted ? 'stopped' : null });
    const secs = app.turnStartedAt ? (app.now() - app.turnStartedAt) / 1000 : null;
    const usage = p.usage || null;
    app.lastUsage = usage;
    if (p.contextWindow) app.contextWindow = p.contextWindow;
    const tps = p.timings && p.timings.predicted_per_second ? Number(p.timings.predicted_per_second) : null;
    const aborted = !!p.aborted || p.finishReason === 'abort' || p.stopReason === 'aborted';
    app.push(new SummaryBlock({ aborted, iterations: p.iterations, tokens: usage && usage.total_tokens, secs, tps }));
    if (aborted) app.exitCode = 2;
    app.endTurn(true);
  }

  _error(p) {
    const app = this.app;
    this.sealAnswer();
    this.sealReasoning();
    for (const b of app.blocks) if (b instanceof ToolBlock && !b.done) b.finish({ success: false, error: 'interrupted' });
    app.push(new ErrorBlock(p.message || 'unknown error'));
    app.exitCode = 1;
    app.endTurn(true);
  }

  static _lastOpen(blocks, match) {
    for (let i = blocks.length - 1; i >= 0; i--) if (!blocks[i].done && match(blocks[i])) return blocks[i];
    return null;
  }
}

module.exports = TurnFrames;
