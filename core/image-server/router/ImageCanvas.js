class ImageCanvas {
  static QWEN_NATIVE_SIZES = [
    [1328, 1328], [1664, 928], [928, 1664], [1472, 1104],
    [1104, 1472], [1584, 1056], [1056, 1584],
  ];

  static QWEN_SNAP_MIN_AREA = 0.5 * 1024 * 1024;

  static snapToQwenNative(width, height) {
    if (!(width > 0 && height > 0) || (width * height) < ImageCanvas.QWEN_SNAP_MIN_AREA) return null;
    const best = ImageCanvas._nearestAspect(width / height);
    if (!best || (best[0] === width && best[1] === height)) return null;
    return { width: best[0], height: best[1] };
  }

  static alignToGrid(width, height, constraints) {
    const grid = Number(constraints && constraints.dimensionMultiple) || 0;
    if (!(grid > 1) || !(width > 0 && height > 0)) return null;
    const alignedWidth = ImageCanvas._alignDown(width, grid);
    const alignedHeight = ImageCanvas._alignDown(height, grid);
    if (alignedWidth === width && alignedHeight === height) return null;
    return { width: alignedWidth, height: alignedHeight };
  }

  static _nearestAspect(aspect) {
    let best = null;
    let bestDistance = Infinity;
    for (const size of ImageCanvas.QWEN_NATIVE_SIZES) {
      const distance = Math.abs((size[0] / size[1]) - aspect);
      if (distance < bestDistance) { bestDistance = distance; best = size; }
    }
    return best;
  }

  static _alignDown(n, grid) {
    return Math.max(grid, Math.floor(n / grid) * grid);
  }
}

module.exports = ImageCanvas;
