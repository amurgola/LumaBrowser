class EditRenderScale {
  static SLACK = 0.98;

  static plan({ canvas, source = null, scale, minPixels = 0, maxPixels = 0, grid = 1 }) {
    const width = Number(canvas && canvas.width);
    const height = Number(canvas && canvas.height);
    const factor = Number(scale);
    if (!(width > 0 && height > 0) || !(factor > 1)) return null;
    const canvasArea = width * height;
    const sourceArea = EditRenderScale._area(source) || canvasArea;
    const wanted = EditRenderScale._capped(Math.max(sourceArea * factor * factor, Number(minPixels) || 0), maxPixels);
    if (canvasArea >= wanted * EditRenderScale.SLACK) return null;
    const grow = Math.sqrt(wanted / canvasArea);
    const size = { width: EditRenderScale._snap(width * grow, grid), height: EditRenderScale._snap(height * grow, grid) };
    return size.width * size.height > canvasArea ? size : null;
  }

  static _area(size) {
    const area = Number(size && size.width) * Number(size && size.height);
    return area > 0 ? area : 0;
  }

  static _capped(area, maxPixels) {
    return Number(maxPixels) > 0 ? Math.min(area, Number(maxPixels)) : area;
  }

  static _snap(n, grid) {
    const cell = Number(grid) > 1 ? Number(grid) : 1;
    return Math.max(cell, Math.floor(Math.round(n * 1000) / 1000 / cell) * cell);
  }
}

module.exports = EditRenderScale;
