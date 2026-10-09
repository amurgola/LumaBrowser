class HitCover {
  static SLACK = 2;
  static SAME_ELEMENT = ['self', 'descendant', 'ancestor'];

  static coverOf(hit, w, refRect) {
    if (!hit) return null;
    if (HitCover.SAME_ELEMENT.includes(hit.relation)) return null;
    if (HitCover.rectContains(refRect, hit.rect)) return null;
    if (hit.relation === 'other') return hit;
    if (hit.top && hit.top !== w.hwnd) return hit;
    return null;
  }

  static rectContains(outer, inner) {
    if (!Array.isArray(outer) || !Array.isArray(inner)) return false;
    const k = HitCover.SLACK;
    return inner[0] >= outer[0] - k && inner[1] >= outer[1] - k
      && inner[0] + inner[2] <= outer[0] + outer[2] + k
      && inner[1] + inner[3] <= outer[1] + outer[3] + k;
  }

  static message(ref, cover, w) {
    const what = cover.name ? `"${cover.name}" (${cover.role || 'element'})` : `a ${cover.role || 'element'}`;
    const other = cover.top && cover.top !== w.hwnd ? ' in another window' : '';
    return `Did not click ref ${ref}: something is covering it: ${what}${other}. Close or move it, or observe again, then retry.`;
  }
}

module.exports = HitCover;
