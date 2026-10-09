export default class StreamImages {
  static SELECTOR = 'img.cm-md-img';

  static PENDING = 'cm-img-pending';

  static FADING = 'cm-img-in';

  static FADE_MS = 300;

  constructor(now = () => performance.now()) {
    this._now = now;
    this._kept = [];
  }

  reset() {
    this._kept = [];
  }

  apply(el) {
    const previous = this._kept;
    const kept = [];
    for (const img of el.querySelectorAll(StreamImages.SELECTOR)) {
      const i = previous.findIndex((old) => old.getAttribute('src') === img.getAttribute('src'));
      if (i !== -1) {
        const old = previous.splice(i, 1)[0];
        img.replaceWith(old);
        this._resumeFade(old);
        kept.push(old);
      } else {
        this._watch(img);
        kept.push(img);
      }
    }
    this._kept = kept;
  }

  _resumeFade(img) {
    if (!img.classList.contains(StreamImages.FADING)) return;
    const elapsed = this._now() - img._cmFadeAt;
    if (elapsed >= StreamImages.FADE_MS) img.classList.remove(StreamImages.FADING);
    else img.style.animationDelay = -Math.round(elapsed) + 'ms';
  }

  _watch(img) {
    if (img.complete && img.naturalWidth) return;
    img.classList.add(StreamImages.PENDING);
    const reveal = () => {
      img.classList.remove(StreamImages.PENDING);
      img.classList.add(StreamImages.FADING);
      img._cmFadeAt = this._now();
      img.addEventListener('animationend', () => img.classList.remove(StreamImages.FADING), { once: true });
    };
    img.addEventListener('load', reveal, { once: true });
    img.addEventListener('error', () => img.classList.remove(StreamImages.PENDING), { once: true });
  }
}
