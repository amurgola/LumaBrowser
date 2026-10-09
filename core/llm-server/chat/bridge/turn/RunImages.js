class RunImages {
  constructor(images) {
    this._turnImages = Array.isArray(images) ? images : [];
    this._sent = false;
    this._pendingToolImages = [];
  }

  get count() {
    return this._turnImages.length;
  }

  forCompletion() {
    const first = (this._turnImages.length && !this._sent) ? this._turnImages : [];
    if (first.length) this._sent = true;
    const out = this._pendingToolImages.length ? [...first, ...this._pendingToolImages] : first;
    this._pendingToolImages = [];
    return out;
  }

  queueToolImage(image) {
    this._pendingToolImages = [image];
  }
}

module.exports = RunImages;
