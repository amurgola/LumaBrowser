export default class StreamFinisher {
  static REGEN_RELOAD_MS = 60;

  constructor(ctx) {
    this._ctx = ctx;
  }

  done(aborted) {
    const { state } = this._ctx;
    if (!state.streaming) return;
    if (aborted && state.streamMsg && !state.streamMsg.content) state.streamMsg.error = 'stopped';
    const conversationId = this._end();
    this._ctx.voice.onTurnDone(aborted);
    this._ctx.pending.onTurnEnd(conversationId, !aborted);
  }

  error(msg, meta) {
    const { state } = this._ctx;
    if (!state.streaming) return;
    this._ctx.voice.onTurnError();
    if (state.streamMsg) {
      state.streamMsg.error = msg;
      state.streamMsg.errorMeta = (meta && meta.code) ? meta : null;
    }
    this._ctx.pending.onTurnEnd(this._end(), false);
  }

  _end() {
    const { state } = this._ctx;
    state.streaming = false;
    const finished = state.streamMsg;
    state.streamMsg = null;
    this._ctx.panel.clearBuilding();
    this._ctx.stream.cancelRender();
    this._dropStaleLiveTab(finished);
    this._ctx.stream.endSink();
    this._rerenderFinished(finished);
    this._ctx.composer.setSendStop(false);
    this._ctx.main.maybeScroll();
    this._ctx.convList.refresh();
    const streamCid = state.streamConvId || state.activeId;
    state.streamConvId = null;
    this._reloadAfterRegenerate(streamCid);
    this._autoTitle(streamCid, finished);
    this._ctx.codeSurface.report();
    this._ctx.plan.paint();
    return streamCid;
  }

  _dropStaleLiveTab(finished) {
    if (!finished || !finished._preview || !finished._preview.live) return;
    finished._preview.live = false;
    this._ctx.previewSlot.release();
  }

  _rerenderFinished(finished) {
    const el = this._ctx.stream.turnEl();
    if (!el || !finished) return;
    const fresh = this._ctx.turns.render(finished);
    el.replaceWith(fresh);
    this._ctx.stream.settle(fresh.querySelector('.cm-asst-body'));
    const think = fresh.querySelector('.cm-think');
    if (think && finished.reasoning && !finished._tc) {
      think.classList.add('open');
      requestAnimationFrame(() => requestAnimationFrame(() => think.classList.remove('open')));
    }
  }

  _reloadAfterRegenerate(cid) {
    const { state } = this._ctx;
    if (state.regenActive && cid) {
      setTimeout(() => { if (state.activeId === cid && !state.streaming) this._ctx.conversation.open(cid); }, StreamFinisher.REGEN_RELOAD_MS);
    }
    state.regenActive = false;
  }

  _autoTitle(cid, finished) {
    const { state, api } = this._ctx;
    if (state.firstTurn && cid && finished && !finished.error) {
      api.conv.autotitle(cid).then((r) => {
        if (!(r && r.success && r.title)) return;
        if (state.activeId === cid) this._ctx.main.setTitle(r.title);
        this._ctx.convList.refresh();
      }).catch(() => {});
    }
    state.firstTurn = false;
  }
}
