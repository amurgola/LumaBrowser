export default class ViewBoundsMath {
  static COLLAPSED = Object.freeze({ x: 0, y: 0, width: 0, height: 0 });

  static compute(base, overlays) {
    const rect = { left: base.left, top: base.top, right: base.right, bottom: base.bottom };
    for (const o of overlays) {
      if (!ViewBoundsMath._intersects(o, rect)) continue;
      if (ViewBoundsMath._covers(o, rect)) return { ...ViewBoundsMath.COLLAPSED };
      ViewBoundsMath._shrink(rect, o);
    }
    return ViewBoundsMath._rounded(rect);
  }

  static _intersects(o, rect) {
    if (o.width === 0 || o.height === 0) return false;
    return !(o.right <= rect.left || o.left >= rect.right || o.bottom <= rect.top || o.top >= rect.bottom);
  }

  static _covers(o, rect) {
    return o.left <= rect.left && o.top <= rect.top && o.right >= rect.right && o.bottom >= rect.bottom;
  }

  static _shrink(rect, o) {
    if (o.top <= rect.top && o.bottom >= rect.bottom) {
      if (o.left <= rect.left) rect.left = Math.min(o.right, rect.right);
      else rect.right = Math.max(o.left, rect.left);
      return;
    }
    if (o.left <= rect.left && o.right >= rect.right) {
      if (o.top <= rect.top) rect.top = Math.min(o.bottom, rect.bottom);
      else rect.bottom = Math.max(o.top, rect.top);
      return;
    }
    ViewBoundsMath._shrinkCorner(rect, o);
  }

  static _shrinkCorner(rect, o) {
    const shrinkTop = o.bottom - rect.top;
    const shrinkBottom = rect.bottom - o.top;
    const shrinkLeft = o.right - rect.left;
    const shrinkRight = rect.right - o.left;
    const min = Math.min(shrinkTop, shrinkBottom, shrinkLeft, shrinkRight);
    if (min === shrinkTop) rect.top = Math.min(o.bottom, rect.bottom);
    else if (min === shrinkBottom) rect.bottom = Math.max(o.top, rect.top);
    else if (min === shrinkLeft) rect.left = Math.min(o.right, rect.right);
    else rect.right = Math.max(o.left, rect.left);
  }

  static _rounded(rect) {
    return {
      x: Math.round(rect.left),
      y: Math.round(rect.top),
      width: Math.round(Math.max(0, rect.right - rect.left)),
      height: Math.round(Math.max(0, rect.bottom - rect.top)),
    };
  }
}
