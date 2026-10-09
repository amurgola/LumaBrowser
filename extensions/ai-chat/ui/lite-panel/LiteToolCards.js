export default class LiteToolCards {
  static reduce(tools, payload) {
    const p = payload || {};
    const handler = LiteToolCards._PHASES[p.phase];
    return handler ? handler(tools.slice(), p) : tools;
  }

  static _pending(tools, p) {
    const i = LiteToolCards._lastIndex(tools, (t) => t.status === 'pending');
    if (i >= 0) tools[i] = { ...tools[i], tool: p.tool || tools[i].tool };
    else tools.push({ tool: p.tool || null, status: 'pending', summary: '' });
    return tools;
  }

  static _run(tools, p) {
    const i = LiteToolCards._lastIndex(tools, (t) => t.status === 'pending');
    const takeover = p.tool === 'ask_user_takeover';
    const card = {
      tool: p.tool || null,
      status: takeover ? 'takeover' : 'running',
      summary: '',
      params: takeover ? (p.params || null) : undefined,
    };
    if (i >= 0) tools[i] = card; else tools.push(card);
    return tools;
  }

  static _approval(tools, p) {
    tools.push({ tool: p.tool || null, status: 'approval', summary: '', detail: p.detail || '', params: p.params || null });
    return tools;
  }

  static _approvalDone(tools, p) {
    const i = LiteToolCards._lastIndex(tools, (t) => t.status === 'approval' && (!p.tool || t.tool === p.tool));
    if (i < 0) return tools;
    if (p.decision === 'reject' || p.decision === 'timeout') {
      tools[i] = { ...tools[i], status: 'error', summary: p.decision === 'timeout' ? 'No answer' : 'Declined' };
    } else {
      tools.splice(i, 1);
    }
    return tools;
  }

  static _done(tools, p) {
    const i = LiteToolCards._lastIndex(tools, (t) =>
      (t.status === 'running' || t.status === 'pending' || t.status === 'takeover')
      && (!p.tool || !t.tool || t.tool === p.tool));
    const stamped = {
      tool: p.tool || (i >= 0 ? tools[i].tool : null),
      status: p.success === false ? 'error' : 'done',
      summary: p.summary || p.error || '',
    };
    if (i >= 0) tools[i] = stamped; else tools.push(stamped);
    return tools;
  }

  static _cancel(tools) {
    return tools.filter((t) => t.status !== 'pending');
  }

  static _lastIndex(arr, pred) {
    for (let i = arr.length - 1; i >= 0; i--) if (pred(arr[i])) return i;
    return -1;
  }

  static _PHASES = {
    pending: LiteToolCards._pending,
    run: LiteToolCards._run,
    approval: LiteToolCards._approval,
    'approval-done': LiteToolCards._approvalDone,
    done: LiteToolCards._done,
    cancel: LiteToolCards._cancel,
  };
}
