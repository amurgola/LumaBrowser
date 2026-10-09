class OnDemandGeometry {
  static ICON_SIZE = 56;
  static PANEL_WIDTH = 380;
  static PANEL_HEIGHT = 520;
  static MARGIN = 16;
  static MIN_PANEL_HEIGHT = 240;

  static defaultPosition(rect, iconSize = OnDemandGeometry.ICON_SIZE) {
    return {
      x: Math.max(0, (rect.width || 0) - iconSize - OnDemandGeometry.MARGIN),
      y: Math.max(0, (rect.height || 0) - iconSize - OnDemandGeometry.MARGIN),
    };
  }

  static clampPosition(pos, rect, iconSize = OnDemandGeometry.ICON_SIZE) {
    const maxX = Math.max(0, (rect.width || 0) - iconSize);
    const maxY = Math.max(0, (rect.height || 0) - iconSize);
    const x = Number.isFinite(pos && pos.x) ? pos.x : 0;
    const y = Number.isFinite(pos && pos.y) ? pos.y : 0;
    return {
      x: Math.round(OnDemandGeometry._clamp(x, 0, maxX)),
      y: Math.round(OnDemandGeometry._clamp(y, 0, maxY)),
    };
  }

  static iconBounds(pos, rect, iconSize = OnDemandGeometry.ICON_SIZE) {
    const p = OnDemandGeometry.clampPosition(pos, rect, iconSize);
    return { x: rect.x + p.x, y: rect.y + p.y, width: iconSize, height: iconSize };
  }

  static panelBounds(pos, rect, { iconSize = OnDemandGeometry.ICON_SIZE, width = OnDemandGeometry.PANEL_WIDTH, height = OnDemandGeometry.PANEL_HEIGHT } = {}) {
    const p = OnDemandGeometry.clampPosition(pos, rect, iconSize);
    const w = Math.max(iconSize, Math.min(width, rect.width || width));
    const h = Math.max(Math.min(OnDemandGeometry.MIN_PANEL_HEIGHT, rect.height || height), Math.min(height, rect.height || height));
    const x = OnDemandGeometry._growFrom(p.x, w, rect.width, iconSize);
    const y = OnDemandGeometry._growFrom(p.y, h, rect.height, iconSize);
    return { x: rect.x + Math.round(x), y: rect.y + Math.round(y), width: Math.round(w), height: Math.round(h) };
  }

  static rectUsable(rect) {
    return !!rect && rect.width > 0 && rect.height > 0;
  }

  static _growFrom(start, size, extent, iconSize) {
    const origin = start + size <= extent ? start : start + iconSize - size;
    return Math.max(0, Math.min(origin, Math.max(0, extent - size)));
  }

  static _clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }
}

module.exports = OnDemandGeometry;
