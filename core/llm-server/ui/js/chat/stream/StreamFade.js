export default class StreamFade {
  static DURATION_MS = 320;

  static STAGGER_MS = 12;

  static STAGGER_SPAN = 12;

  static WORD_CLASS = 'cm-fresh';

  constructor(opts = {}) {
    this._now = opts.now || (() => performance.now());
    this._reducedMotion = opts.reducedMotion || StreamFade._prefersReducedMotion;
    this.reset();
  }

  static _prefersReducedMotion() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  reset() {
    this._arrivals = [];
    this._length = 0;
  }

  apply(el) {
    if (this._reducedMotion()) return;
    const t = this._now();
    const nodes = StreamFade._textNodes(el);
    const total = nodes.reduce((n, node) => n + node.nodeValue.length, 0);
    if (total > this._length) this._arrivals.push({ offset: this._length, at: t });
    else if (total < this._length) this._arrivals = this._arrivals.filter((a) => a.offset < total);
    this._length = total;
    this._wrap(nodes, t);
  }

  settle(el) {
    if (this._reducedMotion() || !el) return;
    const nodes = StreamFade._textNodes(el);
    const total = nodes.reduce((n, node) => n + node.nodeValue.length, 0);
    if (total === this._length) this._wrap(nodes, this._now());
    this.reset();
  }

  _wrap(nodes, t) {
    const windowMs = StreamFade.DURATION_MS + StreamFade.STAGGER_MS * (StreamFade.STAGGER_SPAN - 1);
    this._arrivals = this._arrivals.filter((a) => t - a.at < windowMs);
    if (!this._arrivals.length) return;
    const from = this._arrivals[0].offset;
    const counts = this._arrivals.map(() => 0);
    let offset = 0;
    for (const node of nodes) {
      const start = offset;
      offset += node.nodeValue.length;
      if (offset > from) this._wrapNode(node, start, t, counts);
    }
  }

  _wrapNode(node, start, t, counts) {
    const parts = node.nodeValue.split(/(\s+)/);
    const doc = node.ownerDocument;
    const frag = doc.createDocumentFragment();
    let pos = start;
    let changed = false;
    for (const part of parts) {
      if (!part) continue;
      const delay = /\S/.test(part) ? this._delayAt(pos, t, counts) : null;
      if (delay === null) {
        frag.appendChild(doc.createTextNode(part));
      } else {
        const span = doc.createElement('span');
        span.className = StreamFade.WORD_CLASS;
        span.style.animationDelay = Math.round(delay) + 'ms';
        span.textContent = part;
        frag.appendChild(span);
        changed = true;
      }
      pos += part.length;
    }
    if (changed) node.parentNode.replaceChild(frag, node);
  }

  _delayAt(pos, t, counts) {
    let i = this._arrivals.length - 1;
    while (i >= 0 && this._arrivals[i].offset > pos) i--;
    if (i < 0) return null;
    const stagger = (counts[i]++ % StreamFade.STAGGER_SPAN) * StreamFade.STAGGER_MS;
    const delay = stagger - (t - this._arrivals[i].at);
    return delay + StreamFade.DURATION_MS > 0 ? delay : null;
  }

  static _textNodes(el) {
    const walker = el.ownerDocument.createTreeWalker(el, 4, {
      acceptNode: (n) => (n.parentNode.closest && n.parentNode.closest('svg') ? 2 : 1),
    });
    const out = [];
    for (let n = walker.nextNode(); n; n = walker.nextNode()) out.push(n);
    return out;
  }
}
