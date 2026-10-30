export default class RegionContextBox {
  static PAD_SHARE = 0.6;
  static MIN_PAD_PX = 48;
  static MIN_SIDE = 512;
  static FULL_SHARE = 0.5;

  static resolve({ bounds, width, height }) {
    if (!bounds || !(bounds.width > 0) || !(bounds.height > 0) || !(width > 0) || !(height > 0)) return null;
    const rect = RegionContextBox.box({ bounds, width, height });
    return rect ? { cropped: true, rect } : { cropped: false, rect: { x: 0, y: 0, width, height } };
  }

  static box({ bounds, width, height }) {
    const longer = Math.max(bounds.width, bounds.height);
    const pad = Math.max(RegionContextBox.MIN_PAD_PX, Math.round(longer * RegionContextBox.PAD_SHARE));
    const side = Math.max(RegionContextBox.MIN_SIDE, longer + 2 * pad);
    const w = Math.min(width, side);
    const h = Math.min(height, side);
    if (w * h >= width * height * RegionContextBox.FULL_SHARE) return null;
    const x = RegionContextBox._clamp(Math.round(bounds.x + bounds.width / 2 - w / 2), 0, width - w);
    const y = RegionContextBox._clamp(Math.round(bounds.y + bounds.height / 2 - h / 2), 0, height - h);
    return { x, y, width: w, height: h };
  }

  static describe(context) {
    if (!context) return '';
    if (!context.cropped) return 'Edits the whole image';
    return `Edits a ${context.rect.width}×${context.rect.height} close-up around the area`;
  }

  static _clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }
}
