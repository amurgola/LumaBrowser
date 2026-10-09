class RefSizePlanner {
  static DEFAULT_GRID = 32;

  static plan({ dims, canvas, refArea, grid = RefSizePlanner.DEFAULT_GRID }) {
    const cell = Number(grid) > 1 ? Number(grid) : RefSizePlanner.DEFAULT_GRID;
    const canvasArea = Number(canvas && canvas.width) * Number(canvas && canvas.height);
    const list = dims || [];
    if (!(canvasArea > 0)) return list.map(() => null);
    const supportArea = Number(refArea) > 0 ? Math.min(Number(refArea), canvasArea) : canvasArea;
    return list.map((d, i) => RefSizePlanner._planOne(d, i === 0, canvasArea, supportArea, cell));
  }

  static sizeAtArea(srcW, srcH, area, grid) {
    const w = Math.sqrt((area * srcW) / srcH);
    const h = (w * srcH) / srcW;
    const snap = (n) => Math.max(grid, Math.round(n / grid) * grid);
    return { width: snap(w), height: snap(h) };
  }

  static _planOne(dim, isSource, canvasArea, supportArea, grid) {
    if (!dim || !(dim.width > 0 && dim.height > 0)) return null;
    const area = isSource ? canvasArea : Math.min(supportArea, dim.width * dim.height);
    return RefSizePlanner.sizeAtArea(dim.width, dim.height, area, grid);
  }
}

module.exports = RefSizePlanner;
