class VideoConstraints {
  static normalizeVideoRequest(req = {}, constraints = null) {
    const out = VideoConstraints._readRequest(req || {});
    const adjustments = [];
    if (!constraints || typeof constraints !== 'object') return { ...out, adjustments };
    const note = VideoConstraints._noter(adjustments);
    VideoConstraints._alignDimensions(out, constraints, note);
    VideoConstraints._snapFrames(out, constraints, note);
    VideoConstraints._lockFps(out, constraints, note);
    return { ...out, adjustments };
  }

  static alignUp(n, mult) {
    if (n == null) return null;
    return Math.max(mult, Math.ceil(n / mult) * mult);
  }

  static snapToGrid(n, grid) {
    const step = Math.max(1, Math.floor(VideoConstraints._numOr(grid.step, 1)));
    const offset = Math.floor(VideoConstraints._numOr(grid.offset, 0));
    const min = VideoConstraints._numOr(grid.min, offset);
    const max = VideoConstraints._numOr(grid.max, Infinity);
    const kMin = Math.max(0, Math.ceil((min - offset) / step));
    const kMax = Number.isFinite(max) ? Math.max(kMin, Math.floor((max - offset) / step)) : Infinity;
    const k = Math.round(((n - offset) / step) - 0.0001);
    const clamped = Math.min(kMax, Math.max(kMin, Number.isFinite(k) ? k : kMin));
    return step * clamped + offset;
  }

  static _readRequest(req) {
    return {
      width: VideoConstraints._numOr(req.width, null),
      height: VideoConstraints._numOr(req.height, null),
      videoFrames: VideoConstraints._numOr(req.videoFrames, null),
      fps: VideoConstraints._numOr(req.fps, null),
    };
  }

  static _noter(adjustments) {
    return (field, from, to, reason) => {
      if (from == null || to == null || from === to) return;
      adjustments.push({ field, from, to, reason });
    };
  }

  static _alignDimensions(out, constraints, note) {
    const mult = VideoConstraints._numOr(constraints.dimensionMultiple, 0);
    if (mult <= 1) return;
    const width = VideoConstraints.alignUp(out.width, mult);
    const height = VideoConstraints.alignUp(out.height, mult);
    note('width', out.width, width, `aligned up to a multiple of ${mult}`);
    note('height', out.height, height, `aligned up to a multiple of ${mult}`);
    out.width = width;
    out.height = height;
  }

  static _snapFrames(out, constraints, note) {
    const grid = constraints.frames;
    if (!grid || typeof grid !== 'object' || out.videoFrames == null) return;
    const snapped = VideoConstraints.snapToGrid(out.videoFrames, grid);
    const label = `${VideoConstraints._numOr(grid.step, 1)}k+${VideoConstraints._numOr(grid.offset, 0)}`;
    note('videoFrames', out.videoFrames, snapped, `snapped to the ${label} frame grid`);
    out.videoFrames = snapped;
  }

  static _lockFps(out, constraints, note) {
    const lockedFps = VideoConstraints._numOr(constraints.fps, 0);
    if (lockedFps <= 0) return;
    note('fps', out.fps, lockedFps, 'this model renders at a fixed frame rate');
    out.fps = lockedFps;
  }

  static _numOr(value, fallback) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }
}

module.exports = VideoConstraints;
