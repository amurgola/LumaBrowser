class ScreenshotReply {
  static SCALE_EPSILON = 0.01;

  static build(data, fullPage) {
    if (!data || !data.screenshot) return null;
    const content = [{ type: 'image', data: data.screenshot, mimeType: data.mimeType || 'image/png' }];
    const note = ScreenshotReply.note(data, fullPage);
    if (note) content.push({ type: 'text', text: note });
    return { content };
  }

  static note(data, fullPage) {
    const parts = [];
    if (data.frame && !fullPage) parts.push(ScreenshotReply._geometry(data.frame));
    if (data.marks && data.marks.text) parts.push(data.marks.text);
    return parts.join('\n');
  }

  static _geometry(f) {
    const scaled = Math.abs((f.scale || 1) - 1) > ScreenshotReply.SCALE_EPSILON;
    if (!scaled) {
      return `Screenshot ${f.imageWidth}x${f.imageHeight} px = the CSS viewport; its pixel coordinates can be passed directly to browser_click_at.`;
    }
    const scale = f.scale.toFixed(2);
    return `Screenshot ${f.imageWidth}x${f.imageHeight} px at ${scale}x the ${f.cssWidth}x${f.cssHeight} CSS viewport; divide pixel coordinates by ${scale} for browser_click_at.`;
  }
}

module.exports = ScreenshotReply;
