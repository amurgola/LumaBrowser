class AttachPlacement {
  static DOCK = 36;
  static DOCK_MARGIN = 10;
  static DOCK_INSET = 10;
  static PANEL_W = 384;
  static PANEL_MIN_H = 380;
  static PANEL_MAX_H = 680;
  static GAP = 8;
  static PANEL_MARGIN = 12;

  static dock(frame) {
    const size = AttachPlacement.DOCK + 2 * AttachPlacement.DOCK_MARGIN;
    return {
      x: Math.round(frame.x + AttachPlacement.DOCK_INSET - AttachPlacement.DOCK_MARGIN),
      y: Math.round(frame.y + frame.height - AttachPlacement.DOCK_INSET - AttachPlacement.DOCK - AttachPlacement.DOCK_MARGIN),
      width: size,
      height: size,
    };
  }

  static panel(frame, area) {
    const W = AttachPlacement.PANEL_W;
    const G = AttachPlacement.GAP;
    const M = AttachPlacement.PANEL_MARGIN;
    const maxH = Math.min(AttachPlacement.PANEL_MAX_H, area.height - 2 * G);
    const h = Math.round(Math.max(Math.min(AttachPlacement.PANEL_MIN_H, maxH), Math.min(frame.height, maxH)));
    const clampY = (y) => Math.max(area.y + G, Math.min(y, area.y + area.height - h - G));
    const bottomY = clampY(frame.y + frame.height - h + M);
    const left = frame.x - G - W + M;
    if (left + M >= area.x) return { x: Math.round(left), y: Math.round(bottomY), width: W, height: h, side: 'left' };
    const right = frame.x + frame.width + G - M;
    if (right + W - M <= area.x + area.width) return { x: Math.round(right), y: Math.round(bottomY), width: W, height: h, side: 'right' };
    const dockTop = frame.y + frame.height - AttachPlacement.DOCK_INSET - AttachPlacement.DOCK;
    const x = Math.max(area.x + G, Math.min(frame.x + AttachPlacement.DOCK_INSET, area.x + area.width - W - G));
    return { x: Math.round(x), y: Math.round(clampY(dockTop - G - h)), width: W, height: h, side: 'inside' };
  }
}

module.exports = AttachPlacement;
