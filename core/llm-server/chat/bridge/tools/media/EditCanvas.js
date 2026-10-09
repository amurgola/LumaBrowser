const EditFrames = require('../../../../../image-server/EditFrames');

class EditCanvas {
  static DEFAULT_FRAME = 'match';
  static REMOTE_GRID = 64;
  static FALLBACK_SIDE = 512;
  static MIN_SIDE = 256;
  static MAX_SIDE = 1024;
  static ALIGN = 64;

  static requestedFrame(params) {
    const raw = params && typeof params.frame === 'string' ? params.frame.trim().toLowerCase() : '';
    return EditFrames.NAMES.includes(raw) ? raw : EditCanvas.DEFAULT_FRAME;
  }

  static async resolve({ frame, srcDims, choice, imageRouter }) {
    const canvas = await EditCanvas._modelCanvas({ frame, srcDims, choice, imageRouter });
    return canvas || EditCanvas._sourceShaped(srcDims);
  }

  static async _modelCanvas({ frame, srcDims, choice, imageRouter }) {
    if (choice.remoteEdit) return EditFrames.resolveFrame({ frame, srcDims, native: null, grid: EditCanvas.REMOTE_GRID });
    if (!choice.editCapable || !imageRouter || typeof imageRouter.getFrameSizes !== 'function') return null;
    try {
      const sizes = await imageRouter.getFrameSizes(choice.editModelId || null);
      return sizes ? EditFrames.resolveFrame({ frame, srcDims, native: sizes.native, grid: sizes.grid }) : null;
    } catch (_) {
      return null;
    }
  }

  static _sourceShaped(srcDims) {
    return {
      width: EditCanvas._align(srcDims && srcDims.width),
      height: EditCanvas._align(srcDims && srcDims.height),
      frame: EditCanvas.DEFAULT_FRAME,
      scaled: false,
    };
  }

  static _align(n) {
    if (!Number.isFinite(n) || n <= 0) return EditCanvas.FALLBACK_SIDE;
    return Math.max(EditCanvas.MIN_SIDE, Math.min(EditCanvas.MAX_SIDE, Math.floor(n / EditCanvas.ALIGN) * EditCanvas.ALIGN || EditCanvas.MIN_SIDE));
  }
}

module.exports = EditCanvas;
