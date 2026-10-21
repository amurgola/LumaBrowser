export default class ToolEventReducer {
  static apply(msg, p) {
    if (!msg.tools) msg.tools = [];
    const handler = ToolEventReducer.PHASES[p.phase];
    return (handler && handler(msg, p)) || {};
  }

  static openStep(msg, tool, callId = null) {
    const steps = msg.tools || [];
    if (callId != null) {
      const own = steps.find((x) => x._callId === callId && x.status === 'run');
      if (own) return own;
    }
    return [...steps].reverse().find((x) => x.tool === tool && x.status === 'run' && !x._approval);
  }

  static _stamp(step, p) {
    if (p.callId != null) step._callId = p.callId;
    if (p.batchSize > 1) step._batch = { size: p.batchSize, index: p.batchIndex };
  }

  static _pending(msg, p) {
    const fill = (x) => {
      if (p.tool && !x.tool) x.tool = p.tool;
      if (p.target && !x._target) x._target = p.target;
      if (p.chars > 0) x._chars = p.chars;
    };
    const pend = ToolEventReducer._pendingStep(msg, p.index);
    if (pend) { fill(pend); return; }
    const step = { tool: p.tool || null, params: null, status: 'run', _pending: true };
    if (Number.isInteger(p.index)) step._pendingIndex = p.index;
    fill(step);
    msg.tools.push(step);
  }

  static _pendingStep(msg, index) {
    if (!Number.isInteger(index)) return msg.tools.find((x) => x._pending);
    return msg.tools.find((x) => x._pending && x._pendingIndex === index);
  }

  static _run(msg, p) {
    const pend = msg.tools.find((x) => x._pending && x.tool === p.tool) || msg.tools.find((x) => x._pending);
    if (pend) {
      pend.tool = p.tool; pend.params = p.params; pend._pending = false; delete pend._pendingIndex;
      ToolEventReducer._stamp(pend, p);
      return;
    }
    const step = { tool: p.tool, params: p.params, status: 'run' };
    ToolEventReducer._stamp(step, p);
    msg.tools.push(step);
  }

  static _approval(msg, p) {
    msg.tools.push({ tool: p.tool, params: p.params, status: 'run', _approval: { detail: p.detail || '', grants: p.grants || '', grantScope: p.grantScope || 'run' } });
  }

  static _approvalDone(msg, p) {
    const open = [...msg.tools].reverse().find((x) => x._approval && x.status === 'run' && x.tool === p.tool);
    if (!open) return;
    open._approval.decision = p.decision;
    if (p.decision === 'reject' || p.decision === 'timeout') {
      open.status = 'err';
      open.error = p.decision === 'timeout' ? 'No answer' : 'Declined';
      return;
    }
    msg.tools = msg.tools.filter((x) => x !== open);
  }

  static _status(msg, p) {
    const open = ToolEventReducer.openStep(msg, p.tool, p.callId);
    if (!open) return;
    const progress = {};
    if (typeof p.step === 'number') progress.step = p.step;
    if (typeof p.totalSteps === 'number') progress.totalSteps = p.totalSteps;
    if (typeof p.elapsedMs === 'number') progress.elapsedMs = p.elapsedMs;
    if (p.message) progress.message = String(p.message);
    open._progress = progress;
  }

  static _done(msg, p) {
    const open = ToolEventReducer.openStep(msg, p.tool, p.callId);
    if (!open) return;
    open.status = p.success ? 'ok' : 'err';
    open.error = p.error || null;
    open.summary = p.summary || null;
    delete open._progress;
  }

  static _tab(msg, p) {
    msg._preview = { tabId: p.tabId, live: true, frame: null };
  }

  static _tabEnd(msg, p) {
    const pv = msg._preview;
    if (!pv || pv.tabId !== p.tabId) return null;
    pv.live = false;
    if (p.frame) pv.frame = p.frame;
    return { tabEnded: true };
  }

  static _cancel(msg) {
    msg.tools = msg.tools.filter((x) => !x._pending);
  }

  static PHASES = {
    pending: ToolEventReducer._pending,
    run: ToolEventReducer._run,
    approval: ToolEventReducer._approval,
    'approval-done': ToolEventReducer._approvalDone,
    status: ToolEventReducer._status,
    done: ToolEventReducer._done,
    tab: ToolEventReducer._tab,
    'tab-end': ToolEventReducer._tabEnd,
    cancel: ToolEventReducer._cancel,
  };
}
