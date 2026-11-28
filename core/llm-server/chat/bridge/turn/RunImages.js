class RunImages {
  constructor(images) {
    this._turnImages = Array.isArray(images) ? images : [];
    this._sent = false;
    this._pendingToolImages = [];
    this._handedOut = RunImages._nothing();
  }

  get count() {
    return this._turnImages.length;
  }

  forCompletion() {
    const first = (this._turnImages.length && !this._sent) ? this._turnImages : [];
    if (first.length) this._sent = true;
    const toolImages = this._pendingToolImages;
    this._pendingToolImages = [];
    this._handedOut = { turnImages: first.length > 0, toolImages };
    return toolImages.length ? [...first, ...toolImages] : first;
  }

  returnUndelivered() {
    const { turnImages, toolImages } = this._handedOut;
    if (turnImages) this._sent = false;
    if (toolImages.length && !this._pendingToolImages.length) this._pendingToolImages = toolImages;
    this._handedOut = RunImages._nothing();
  }

  queueToolImage(image) {
    this._pendingToolImages = [image];
  }

  static _nothing() {
    return { turnImages: false, toolImages: [] };
  }
}

module.exports = RunImages;
