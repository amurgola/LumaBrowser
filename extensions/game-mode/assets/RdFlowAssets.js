class RdFlowAssets {
  static SIZE = 64;

  static MAX_ASPECT = 4 / 3;

  static MARGIN_SENTENCE = 'The whole subject is visible with a clear margin on every side and nothing cut off.';

  static TRANSPARENT_SENTENCE = 'The background is transparent.';

  static BANNED = /\b(pixel[- ]?art|pixelated|64 ?x ?64)\b ?/gi;

  static RENDERING = /\b(outline|outlines|shading|shaded|palette|rendering|rendered|dither)/i;

  static isModel(modelRef) {
    return /(^|[:/])rd[-_ ]?flow/i.test(String(modelRef || ''));
  }

  static canDraw(asset) {
    const a = asset || {};
    const w = Number(a.gridW);
    const h = Number(a.gridH);
    if (!a.pixel || !(w > 0 && h > 0)) return false;
    if (Math.max(w, h) / Math.min(w, h) > RdFlowAssets.MAX_ASPECT) return false;
    const long = Math.max(w, h);
    return long <= RdFlowAssets.SIZE || long % RdFlowAssets.SIZE === 0;
  }

  static caption(prompt, transparent) {
    const text = String(prompt || '').replace(RdFlowAssets.BANNED, '').replace(/\s+/g, ' ').trim();
    const dropped = transparent ? /\b(background|transparent)\b/i : /\btransparent\b/i;
    const sentences = RdFlowAssets._sentences(text).filter((s) => !dropped.test(s));
    if (!transparent) return sentences.join(' ');
    let at = sentences.length;
    while (at > 1 && RdFlowAssets.RENDERING.test(sentences[at - 1])) at -= 1;
    const closing = /clear margin|nothing cut off/i.test(text) ? [] : [RdFlowAssets.MARGIN_SENTENCE];
    sentences.splice(at, 0, ...closing, RdFlowAssets.TRANSPARENT_SENTENCE);
    return sentences.join(' ');
  }

  static _sentences(text) {
    return (text.match(/[^.!?]+[.!?]*/g) || []).map((s) => s.trim()).filter(Boolean);
  }
}

module.exports = RdFlowAssets;
