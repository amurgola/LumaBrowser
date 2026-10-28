import RegionMaskData from './RegionMaskData.js';

export default class RegionPainter {
  static PAINT_RGBA = [245, 144, 52, 160];
  static MAX_UNDO = 25;
  static MIN_SIZE = 4;
  static MAX_SIZE = 400;
  static TOOLS = ['brush', 'eraser'];

  constructor({ canvas, width, height }) {
    this._canvas = canvas;
    this._canvas.width = width;
    this._canvas.height = height;
    this._ctx = canvas.getContext('2d');
    this._undo = [];
    this._stroke = null;
    this.tool = 'brush';
    this.size = RegionPainter.defaultSize(width, height);
  }

  static defaultSize(width, height) {
    return RegionPainter.clampSize(Math.round(Math.max(width, height) / 20));
  }

  static clampSize(size) {
    const n = Number(size);
    if (!Number.isFinite(n)) return RegionPainter.MIN_SIZE;
    return Math.max(RegionPainter.MIN_SIZE, Math.min(RegionPainter.MAX_SIZE, Math.round(n)));
  }

  get width() {
    return this._canvas.width;
  }

  get height() {
    return this._canvas.height;
  }

  get canUndo() {
    return this._undo.length > 0;
  }

  setTool(tool) {
    if (RegionPainter.TOOLS.includes(tool)) this.tool = tool;
  }

  setSize(size) {
    this.size = RegionPainter.clampSize(size);
  }

  pointToImage(event) {
    const rect = this._canvas.getBoundingClientRect();
    const sx = rect.width ? this.width / rect.width : 1;
    const sy = rect.height ? this.height / rect.height : 1;
    return { x: (event.clientX - rect.left) * sx, y: (event.clientY - rect.top) * sy };
  }

  begin(point) {
    this._snapshot();
    this._stroke = point;
    this._dab(point, point);
  }

  move(point) {
    if (!this._stroke) return;
    this._dab(this._stroke, point);
    this._stroke = point;
  }

  end() {
    this._stroke = null;
  }

  undo() {
    const previous = this._undo.pop();
    if (!previous) return false;
    this._ctx.putImageData(previous, 0, 0);
    return true;
  }

  clear() {
    if (this.isBlank()) return;
    this._snapshot();
    this._ctx.clearRect(0, 0, this.width, this.height);
  }

  imageData() {
    return this._ctx.getImageData(0, 0, this.width, this.height);
  }

  isBlank() {
    return RegionMaskData.isBlank(this.imageData());
  }

  coverage() {
    return RegionMaskData.coverage(this.imageData());
  }

  loadMask(maskImage) {
    const scratch = document.createElement('canvas');
    scratch.width = this.width;
    scratch.height = this.height;
    const sctx = scratch.getContext('2d');
    if (!sctx) return;
    sctx.drawImage(maskImage, 0, 0, this.width, this.height);
    const paint = RegionMaskData.paintPixels(sctx.getImageData(0, 0, this.width, this.height), RegionPainter.PAINT_RGBA);
    const out = this._ctx.createImageData(this.width, this.height);
    out.data.set(paint);
    this._ctx.putImageData(out, 0, 0);
  }

  _snapshot() {
    this._undo.push(this.imageData());
    if (this._undo.length > RegionPainter.MAX_UNDO) this._undo.shift();
  }

  _dab(from, to) {
    const ctx = this._ctx;
    const [r, g, b, a] = RegionPainter.PAINT_RGBA;
    ctx.save();
    ctx.globalCompositeOperation = this.tool === 'eraser' ? 'destination-out' : 'source-over';
    ctx.strokeStyle = `rgba(${r},${g},${b},${a / 255})`;
    ctx.lineWidth = this.size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x === from.x && to.y === from.y ? to.x + 0.01 : to.x, to.y);
    ctx.stroke();
    ctx.restore();
  }
}
