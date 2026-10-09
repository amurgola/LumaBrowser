class TabPreviewGeometry {
  static MIN_PREVIEW_PX = 8;
  static FIT_TARGET_WIDTH_PX = 1280;
  static MIN_PREVIEW_ZOOM = 0.34;
  static FIT_SLACK = 1.03;

  static clampZoom(zoom) {
    if (!Number.isFinite(zoom) || zoom <= 0) return 1;
    return Math.min(1, Math.max(TabPreviewGeometry.MIN_PREVIEW_ZOOM, Math.round(zoom * 100) / 100));
  }

  static widthZoom(boundsWidth) {
    return TabPreviewGeometry.clampZoom(boundsWidth / TabPreviewGeometry.FIT_TARGET_WIDTH_PX);
  }

  static fittedZoom(baseZoom, boundsHeight, docHeight) {
    const visible = boundsHeight / baseZoom;
    if (docHeight > visible * TabPreviewGeometry.FIT_SLACK) {
      return TabPreviewGeometry.clampZoom(baseZoom * (visible / docHeight));
    }
    return baseZoom;
  }

  static toWindowRect(rect, content, hostZoom) {
    const out = TabPreviewGeometry._scaleIntoContent(rect, content, hostZoom);
    if (out.width < TabPreviewGeometry.MIN_PREVIEW_PX || out.height < TabPreviewGeometry.MIN_PREVIEW_PX) return null;
    return TabPreviewGeometry._isInside(out, content) ? out : null;
  }

  static _scaleIntoContent(rect, content, zoom) {
    return {
      x: Math.round(content.x + rect.x * zoom),
      y: Math.round(content.y + rect.y * zoom),
      width: Math.round(rect.width * zoom),
      height: Math.round(rect.height * zoom),
    };
  }

  static _isInside(r, content) {
    if (r.x < content.x || r.y < content.y) return false;
    if (r.x + r.width > content.x + content.width) return false;
    return r.y + r.height <= content.y + content.height;
  }
}

module.exports = TabPreviewGeometry;
