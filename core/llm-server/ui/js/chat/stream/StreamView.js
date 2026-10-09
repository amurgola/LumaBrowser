import ChatIcons from '../ChatIcons.js';
import AgentRunCards from '../turns/AgentRunCards.js';
import ArtifactChips from '../turns/ArtifactChips.js';
import ReplyChoices from '../turns/ReplyChoices.js';
import ThinkPane from '../turns/ThinkPane.js';
import TurnData from '../turns/TurnData.js';
import MarkdownRenderer from '../../markdown/MarkdownRenderer.js';
import StreamFade from './StreamFade.js';
import StreamImages from './StreamImages.js';

export default class StreamView {
  static THROTTLE_MS = 55;

  constructor(ctx) {
    this._ctx = ctx;
    this._sink = null;
    this._timer = null;
    this._fade = new StreamFade();
    this._images = new StreamImages();
    this._observer = null;
  }

  register() {
    const R = this._ctx.resonant;
    R.add('liveAnswer', '');
    R.format('liveAnswer', (raw, meta) => MarkdownRenderer.render(ReplyChoices.stripStreaming(raw),
      { streaming: !(meta && meta.done) }));
  }

  append(opts) {
    const thread = this._ctx.els.scroll.querySelector('.cm-thread');
    if (!thread) return;
    StreamView._retireOlderTurnControls(thread);
    const turn = this._ctx.turns.render(this._ctx.state.streamMsg);
    turn.dataset.streaming = '1';
    const replace = opts && opts.replace;
    if (replace && replace.parentElement === thread) replace.replaceWith(turn);
    else thread.insertBefore(turn, thread.querySelector('.cm-thread-foot'));
    const body = turn.querySelector('.cm-asst-body');
    if (body) this._bindBody(body, !!replace);
  }

  turnEl() {
    const thread = this._ctx.els.scroll.querySelector('.cm-thread');
    return thread ? thread.querySelector('.cm-turn[data-streaming="1"]') : null;
  }

  write(text) {
    if (this._sink) this._sink.write(text);
  }

  rewind(n) {
    if (this._sink) this._sink.rewind(n);
  }

  endSink() {
    if (!this._sink) return;
    try { this._sink.end(); } catch (_) {}
    this._sink = null;
  }

  settle(body) {
    this._unwatch();
    if (body) this._images.apply(body);
    this._images.reset();
    this._fade.settle(body);
  }

  cancelRender() {
    if (this._timer) { clearTimeout(this._timer); this._timer = null; }
  }

  scheduleRender() {
    if (this._timer) return;
    this._timer = setTimeout(() => { this._timer = null; this._render(); }, StreamView.THROTTLE_MS);
  }

  static _retireOlderTurnControls(thread) {
    thread.querySelectorAll('.cm-choices').forEach((e) => e.remove());
    thread.querySelectorAll('.cm-edit-box, [data-tact="edit"]').forEach((e) => e.remove());
    thread.querySelectorAll('.cm-asst-body').forEach((e) => { e.style.display = ''; });
  }

  _bindBody(body, reattach) {
    if (this._sink && reattach) {
      body.setAttribute('res', 'liveAnswer');
      if (!body.innerHTML) body.innerHTML = ChatIcons.pulse();
      this._watch(body);
      return;
    }
    this._ctx.resonant.data.liveAnswer = '';
    body.setAttribute('res', 'liveAnswer');
    if (!body.innerHTML) body.innerHTML = ChatIcons.pulse();
    this._fade.reset();
    this._images.reset();
    this._watch(body);
    this._sink = this._ctx.resonant.stream('liveAnswer', { throttle: StreamView.THROTTLE_MS });
  }

  _watch(body) {
    this._unwatch();
    if (typeof MutationObserver !== 'function') return;
    const observer = new MutationObserver(() => {
      this._images.apply(body);
      this._fade.apply(body);
      observer.takeRecords();
    });
    observer.observe(body, { childList: true });
    this._observer = observer;
  }

  _unwatch() {
    if (this._observer) { this._observer.disconnect(); this._observer = null; }
  }

  _render() {
    const el = this.turnEl();
    const m = this._ctx.state.streamMsg;
    if (!el || !m) return;
    const sel = window.getSelection ? window.getSelection() : null;
    if (sel && !sel.isCollapsed && sel.anchorNode && el.contains(sel.anchorNode)) { this.scheduleRender(); return; }
    if (TurnData.hasReasoning(m.reasoning)) this._renderThinking(el, m);
    this._syncCards(el, m);
    AgentRunCards.sync(el, m);
    this._ctx.main.maybeScroll();
  }

  _renderThinking(el, m) {
    const body = el.querySelector('.cm-asst-body');
    let think = el.querySelector('.cm-think');
    const stillThinking = this._ctx.thinkPane.isThinkingNow(m);
    if (!think) {
      think = ThinkPane.create(m.reasoning, true, stillThinking);
      el.querySelector('.cm-asst').insertBefore(think, body);
    } else {
      ThinkPane.update(think, m.reasoning, stillThinking);
    }
    if (m.content && !m._tc) {
      m._tc = true;
      think.classList.remove('open');
    } else if (!m._tc) {
      ThinkPane.scrollToEnd(think);
    }
  }

  _syncCards(el, m) {
    const asst = el.querySelector('.cm-asst');
    const body = el.querySelector('.cm-asst-body');
    if (!asst || !body) return;
    const chain = this._ctx.chain;
    const tcSig = chain.signature(m);
    const oldTc = asst.querySelector('.cm-chain');
    if (!oldTc || oldTc.dataset.sig !== tcSig) {
      if (oldTc) oldTc.remove();
      const fresh = chain.create(m);
      if (fresh) { fresh.dataset.sig = tcSig; asst.insertBefore(fresh, body); }
    } else {
      chain.updatePendingDetail(oldTc, m);
    }
    this._ctx.previewSlot.poke();
    this._syncArtifacts(asst, body, m);
  }

  _syncArtifacts(asst, body, m) {
    const arSig = ArtifactChips.signature(m);
    const oldAr = asst.querySelector('.cm-artifacts');
    if (oldAr && oldAr.dataset.sig === arSig) return;
    if (oldAr) oldAr.remove();
    const fresh = this._ctx.artifactChips.create(m);
    if (fresh) { fresh.dataset.sig = arSig; asst.insertBefore(fresh, body.nextSibling); }
  }
}
