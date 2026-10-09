const OnDemandGeometry = require('./OnDemandGeometry');

class OnDemandPlacement {
  static PAD = 12;

  static emptyRect() {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  static pageRect(bounds) {
    if (!bounds) return OnDemandPlacement.emptyRect();
    return { x: bounds.x || 0, y: bounds.y || 0, width: bounds.width || 0, height: bounds.height || 0 };
  }

  static innerBounds(pos, rect, expanded) {
    const anchor = pos || OnDemandGeometry.defaultPosition(rect);
    return expanded ? OnDemandGeometry.panelBounds(anchor, rect) : OnDemandGeometry.iconBounds(anchor, rect);
  }

  static windowBounds(inner, origin) {
    const base = origin || { x: 0, y: 0 };
    const pad = OnDemandPlacement.PAD;
    return {
      x: Math.round(base.x + inner.x - pad),
      y: Math.round(base.y + inner.y - pad),
      width: Math.round(inner.width + pad * 2),
      height: Math.round(inner.height + pad * 2),
    };
  }

  static tileRect(inner) {
    return inner ? { x: inner.x, y: inner.y, width: inner.width, height: inner.height } : null;
  }

  static isValidPosition(pos) {
    return Boolean(pos) && Number.isFinite(pos.x) && Number.isFinite(pos.y);
  }
}

module.exports = OnDemandPlacement;
