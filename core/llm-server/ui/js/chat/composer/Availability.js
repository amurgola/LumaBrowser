import ComposerView from './ComposerView.js';

export default class Availability {
  constructor(ctx) {
    this._ctx = ctx;
  }

  set(ok, reason) {
    const { state } = this._ctx;
    const changed = state.aiAvailable !== !!ok || state.aiUnavailableReason !== (reason || '');
    state.aiAvailable = !!ok;
    state.aiUnavailableReason = reason || '';
    if (changed) this.render();
  }

  render() {
    const { state, root } = this._ctx;
    const ok = state.aiAvailable;
    root.querySelectorAll('[data-cm-nomodel]').forEach((c) => {
      c.hidden = ok;
      const t = c.querySelector('.cm-nomodel-text');
      if (t) t.textContent = state.aiUnavailableReason || ComposerView.NO_MODEL;
    });
    root.querySelectorAll('.cm-chip[data-seed]').forEach((b) => { b.disabled = !ok; });
    this._ctx.composer.refreshSendState();
  }

  applyServerState(st) {
    if (!st || typeof st !== 'object') return;
    const status = st.status || st.state;
    if (status === 'error') {
      this.set(false, st.label || 'The model server reported an error. Open Setup to check it.');
    } else if (this._ctx.state.models.length) {
      this.set(true, '');
    }
  }
}
