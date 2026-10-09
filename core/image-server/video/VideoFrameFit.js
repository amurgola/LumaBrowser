const ImageDimensions = require('../../shared/content/ImageDimensions');

class VideoFrameFit {
  static DEFAULT_BUDGET = Object.freeze({ width: 832, height: 480 });
  static MIN_MULTIPLE = 16;

  static fit(model, firstFrame) {
    const src = ImageDimensions.read(VideoFrameFit._toBuffer(firstFrame));
    if (!src) return null;
    const budget = (model && model.defaults) || {};
    return ImageDimensions.fitToBudget({
      srcWidth: src.width,
      srcHeight: src.height,
      budgetWidth: budget.width || VideoFrameFit.DEFAULT_BUDGET.width,
      budgetHeight: budget.height || VideoFrameFit.DEFAULT_BUDGET.height,
      multiple: VideoFrameFit._multiple(model),
    });
  }

  static _multiple(model) {
    const grid = Number(model && model.constraints && model.constraints.dimensionMultiple) || 0;
    return Math.max(VideoFrameFit.MIN_MULTIPLE, grid);
  }

  static _toBuffer(frame) {
    return Buffer.isBuffer(frame) ? frame : Buffer.from(String(frame), 'base64');
  }
}

module.exports = VideoFrameFit;
