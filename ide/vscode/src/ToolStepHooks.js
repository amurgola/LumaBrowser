'use strict';

class ToolStepHooks {
  static WRITE_TOOLS = ['write_file', 'edit_file'];

  constructor(session) {
    this._session = session;
    this._tool = null;
    this._toolPath = null;
    this._dismissApproval = null;
  }

  onTool(p) {
    const phase = typeof p.phase === 'string' ? p.phase : null;
    if (!phase) return;
    const tool = typeof p.tool === 'string' ? p.tool : '';
    const params = p.params && typeof p.params === 'object' ? p.params : null;
    const filePath = params && typeof params.path === 'string' ? params.path : null;
    switch (phase) {
      case 'run': this._onRun(tool, filePath); break;
      case 'done': case 'result': this._onDone(p.success !== false); break;
      case 'approval': this._onApproval(p, tool, filePath); break;
      case 'approval-done': this.expireApproval(); break;
      default: break;
    }
  }

  expireApproval() {
    const dismiss = this._dismissApproval;
    this._dismissApproval = null;
    if (typeof dismiss === 'function') { try { dismiss(); } catch (_) {} }
  }

  _onRun(tool, filePath) {
    const s = this._session;
    this._tool = tool;
    this._toolPath = filePath;
    if (filePath && ToolStepHooks._writes(tool) && s.hooks.snapshot) { try { s.hooks.snapshot(s.root, filePath); } catch (_) {} }
  }

  _onDone(ok) {
    const s = this._session;
    if (ok && this._toolPath && ToolStepHooks._writes(this._tool) && s.hooks.afterWrite) {
      try { s.hooks.afterWrite(s.root, this._toolPath, s.getSettings().openEditedFiles !== false); } catch (_) {}
    }
    this._tool = null;
    this._toolPath = null;
  }

  _onApproval(p, tool, filePath) {
    const s = this._session;
    if (s.getSettings().approvalNotifications === false || !s.hooks.approvalPrompt) return;
    const detail = typeof p.detail === 'string' ? p.detail : (filePath || tool);
    this.expireApproval();
    try {
      this._dismissApproval = s.hooks.approvalPrompt(tool.replace(/_/g, ' '), detail, (d) => s.approve(d)) || null;
    } catch (_) {
      this._dismissApproval = null;
    }
  }

  static _writes(tool) {
    return ToolStepHooks.WRITE_TOOLS.includes(tool);
  }
}

module.exports = ToolStepHooks;
