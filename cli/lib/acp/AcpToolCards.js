const path = require('path');
const ToolGrammar = require('../tui/ToolGrammar');

class AcpToolCards {
  static KIND_OF = {
    read_file: 'read', read_extension_file: 'read', list_dir: 'read', list_extension_files: 'read', project_overview: 'read',
    write_file: 'edit', write_extension_file: 'edit', edit_file: 'edit', save_artifact: 'edit',
    discard_build: 'delete',
    run_command: 'execute', check_process: 'execute', dispatch_batch: 'execute', install_extension: 'execute', validate_code: 'execute',
    grep: 'search', find: 'search', web_search: 'search',
    fetch_page: 'fetch', fetch_url: 'fetch', navigate: 'fetch', take_screenshot: 'fetch', click: 'fetch', type_text: 'fetch',
    chat_with_agent: 'other', list_agents: 'other',
  };

  static OPTIONS = [
    { optionId: 'once', name: 'Allow once', kind: 'allow_once' },
    { optionId: 'run', name: 'Allow for this run', kind: 'allow_always' },
    { optionId: 'reject', name: 'Reject', kind: 'reject_once' },
  ];

  static MAX_OUTPUT_CHARS = 64 * 1024;

  constructor({ cwd } = {}) {
    this._cwd = cwd || '';
    this._seq = 0;
    this._open = [];
    this._delegations = new Map();
  }

  get openCount() {
    return this._open.length;
  }

  static kindOf(tool) {
    return AcpToolCards.KIND_OF[tool] || 'other';
  }

  static title(tool, params) {
    const style = ToolGrammar.toolStyle(tool);
    return `${style.verb} ${ToolGrammar.toolDetail(tool, params)}`.trim() || String(tool || 'tool');
  }

  static locations(tool, params, cwd) {
    const file = ToolGrammar.toolPath(tool, params);
    if (!file) return [];
    const loc = { path: AcpToolCards._absolute(file, cwd) };
    if (tool === 'read_file' && params && Number.isInteger(params.offset) && params.offset > 0) loc.line = params.offset;
    return [loc];
  }

  static diffContent(tool, params, cwd) {
    const p = params && typeof params === 'object' ? params : {};
    if (!p.path) return [];
    const file = AcpToolCards._absolute(String(p.path), cwd);
    if (tool === 'edit_file' && Array.isArray(p.edits)) {
      return p.edits
        .filter((e) => e && typeof e === 'object')
        .map((e) => ({ type: 'diff', path: file, oldText: e.oldText == null ? '' : String(e.oldText), newText: e.newText == null ? '' : String(e.newText) }));
    }
    if ((tool === 'write_file' || tool === 'write_extension_file') && typeof p.content === 'string') {
      return [{ type: 'diff', path: file, oldText: null, newText: p.content }];
    }
    return [];
  }

  static textContent(text) {
    return { type: 'content', content: { type: 'text', text: String(text) } };
  }

  approval(p) {
    const id = this._newId();
    const update = this._start(id, p.tool, p.params, 'pending');
    this._open.push({ id, tool: p.tool, callId: null, phase: 'awaiting', output: '' });
    const options = p.sensitive ? AcpToolCards.OPTIONS.filter((o) => o.optionId !== 'run') : AcpToolCards.OPTIONS;
    const request = {
      toolCall: { toolCallId: id, title: update.title, kind: update.kind, status: 'pending', rawInput: update.rawInput },
      options: options.map((o) => ({ ...o })),
    };
    return { toolCallId: id, update, request };
  }

  approvalDone(p) {
    const card = this._find({ tool: p.tool, phase: 'awaiting' });
    if (!card) return null;
    if (p.decision === 'reject' || p.decision === 'timeout') {
      this._drop(card);
      const text = p.decision === 'timeout' ? 'Nobody answered the approval request in time.' : 'Declined by the user.';
      return { sessionUpdate: 'tool_call_update', toolCallId: card.id, status: 'failed', content: [AcpToolCards.textContent(text)] };
    }
    card.phase = 'approved';
    return null;
  }

  run(p) {
    const approved = this._find({ tool: p.tool, phase: 'approved' });
    if (approved) {
      approved.phase = 'running';
      approved.callId = p.callId == null ? null : p.callId;
      const started = this._start(approved.id, p.tool, p.params, 'in_progress');
      return { ...started, sessionUpdate: 'tool_call_update' };
    }
    const id = this._newId();
    this._open.push({ id, tool: p.tool, callId: p.callId == null ? null : p.callId, phase: 'running', output: '' });
    return this._start(id, p.tool, p.params, 'in_progress');
  }

  done(p) {
    const card = this._findForDone(p);
    if (!card) return null;
    this._drop(card);
    const content = [];
    if (card.output) content.push(AcpToolCards.textContent(card.output));
    const text = p.error ? String(p.error) : (p.summary ? String(p.summary) : '');
    if (text) content.push(AcpToolCards.textContent(text));
    const rawOutput = { success: p.success !== false };
    if (p.error) rawOutput.error = p.error;
    if (p.summary) rawOutput.summary = p.summary;
    return { sessionUpdate: 'tool_call_update', toolCallId: card.id, status: p.success === false ? 'failed' : 'completed', content, rawOutput };
  }

  commandOutput(p) {
    const card = this._find({ tool: 'run_command', phase: 'running', last: true });
    if (!card || !p || !p.chunk) return null;
    card.output = `${card.output}${p.chunk}`.slice(-AcpToolCards.MAX_OUTPUT_CHARS);
    return { sessionUpdate: 'tool_call_update', toolCallId: card.id, content: [AcpToolCards.textContent(card.output)] };
  }

  delegation(p) {
    const key = p.invocationId != null ? String(p.invocationId) : String(p.agentName || 'agent');
    const d = this._delegations.get(key);
    switch (p.phase) {
      case 'start': {
        const id = this._newId();
        this._delegations.set(key, { id, text: '' });
        return { sessionUpdate: 'tool_call', toolCallId: id, title: `Ask ${p.agentName || 'agent'}`, kind: 'other', status: 'in_progress' };
      }
      case 'delta':
        if (!d) return null;
        d.text += p.text || '';
        return { sessionUpdate: 'tool_call_update', toolCallId: d.id, content: [AcpToolCards.textContent(d.text)] };
      case 'rollback':
        if (d) d.text = AcpToolCards._cut(d.text, p.chars);
        return null;
      case 'done':
        if (!d) return null;
        this._delegations.delete(key);
        return { sessionUpdate: 'tool_call_update', toolCallId: d.id, status: 'completed', content: d.text ? [AcpToolCards.textContent(d.text)] : [] };
      case 'error':
        if (!d) return null;
        this._delegations.delete(key);
        return { sessionUpdate: 'tool_call_update', toolCallId: d.id, status: 'failed', content: [AcpToolCards.textContent(p.message || 'the agent failed')] };
      default:
        return null;
    }
  }

  closeOpen(reason) {
    const updates = [];
    for (const card of this._open) {
      updates.push({ sessionUpdate: 'tool_call_update', toolCallId: card.id, status: 'failed', content: [AcpToolCards.textContent(reason)] });
    }
    for (const [, d] of this._delegations) {
      updates.push({ sessionUpdate: 'tool_call_update', toolCallId: d.id, status: 'failed', content: [AcpToolCards.textContent(reason)] });
    }
    this._open = [];
    this._delegations.clear();
    return updates;
  }

  _start(id, tool, params, status) {
    const update = {
      sessionUpdate: 'tool_call',
      toolCallId: id,
      title: AcpToolCards.title(tool, params),
      kind: AcpToolCards.kindOf(tool),
      status,
      rawInput: params && typeof params === 'object' ? params : {},
    };
    const locations = AcpToolCards.locations(tool, params, this._cwd);
    if (locations.length) update.locations = locations;
    const content = AcpToolCards.diffContent(tool, params, this._cwd);
    if (content.length) update.content = content;
    return update;
  }

  _newId() {
    this._seq += 1;
    return `call_${this._seq}`;
  }

  _find({ tool, phase, last = false }) {
    const list = last ? [...this._open].reverse() : this._open;
    return list.find((c) => c.phase === phase && (tool == null || c.tool === tool)) || null;
  }

  _findForDone(p) {
    const running = this._open.filter((c) => c.phase === 'running');
    if (p.callId != null) {
      const byId = running.find((c) => c.callId === p.callId);
      if (byId) return byId;
    }
    return running.find((c) => c.tool === p.tool) || running[0] || null;
  }

  _drop(card) {
    this._open = this._open.filter((c) => c !== card);
  }

  static _absolute(file, cwd) {
    return path.isAbsolute(file) || !cwd ? file : path.resolve(cwd, file);
  }

  static _cut(text, chars) {
    const n = Math.min(Number(chars) || 0, text.length);
    return n >= text.length ? '' : text.slice(0, -n);
  }
}

module.exports = AcpToolCards;
