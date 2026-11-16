class OnDemandGeometry {
  static ICON_SIZE = 56;
  static PANEL_WIDTH = 380;
  static PANEL_HEIGHT = 520;
  static MARGIN = 16;
  static EDGE_PADDING = 10;
  static MIN_PANEL_HEIGHT = 240;

  static defaultPosition(rect, iconSize = OnDemandGeometry.ICON_SIZE) {
    return {
      x: Math.max(0, (rect.width || 0) - iconSize - OnDemandGeometry.MARGIN),
      y: Math.max(0, (rect.height || 0) - iconSize - OnDemandGeometry.MARGIN),
    };
  }

  static clampPosition(pos, rect, iconSize = OnDemandGeometry.ICON_SIZE) {
    const x = Number.isFinite(pos && pos.x) ? pos.x : 0;
    const y = Number.isFinite(pos && pos.y) ? pos.y : 0;
    return {
      x: Math.round(OnDemandGeometry._clampInside(x, rect.width || 0, iconSize)),
      y: Math.round(OnDemandGeometry._clampInside(y, rect.height || 0, iconSize)),
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

  static _clampInside(value, extent, iconSize) {
    const room = Math.max(0, extent - iconSize);
    const padding = Math.min(OnDemandGeometry.EDGE_PADDING, room / 2);
    return OnDemandGeometry._clamp(value, padding, room - padding);
  }

  static _clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }
}

module.exports = OnDemandGeometry;
