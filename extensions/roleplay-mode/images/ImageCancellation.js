const HostGlobals = require('../HostGlobals');

class ImageCancellation {
  static CODE = 'RP_IMAGE_CANCELED';

  static mark() {
    return HostGlobals.imageAbortSeq();
  }

  static wasCancelled(startSeq) {
    return Number.isFinite(startSeq) && HostGlobals.imageAbortSeq() !== startSeq;
  }

  static throwIfCancelled(startSeq) {
    if (!ImageCancellation.wasCancelled(startSeq)) return;
    const err = new Error('Image generation canceled.');
    err.code = ImageCancellation.CODE;
    throw err;
  }
}

module.exports = ImageCancellation;
