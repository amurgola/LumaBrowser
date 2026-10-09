export default class CodeSurfaceReporter {
  constructor(ctx) {
    this._ctx = ctx;
  }

  async report() {
    const { api, state } = this._ctx;
    const id = state.activeId;
    const probe = api && api.chat && api.chat.workspace && api.chat.workspace.info;
    let detail = { conversationId: id || null, available: false, root: '', label: '' };
    if (id && !state.activeTaskId && state.activeMode && state.activeMode !== 'chat' && probe) {
      try {
        const r = await probe({ conversationId: id });
        if (state.activeId !== id) return;
        if (r && r.success) detail = { conversationId: id, available: true, root: r.root, label: r.label };
      } catch (_) {}
    }
    window.dispatchEvent(new CustomEvent('luma-code-surface', { detail }));
  }
}
