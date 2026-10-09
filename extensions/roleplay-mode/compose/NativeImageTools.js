const RoleplayEnv = require('../images/RoleplayEnv');

class NativeImageTools {
  static foregroundMask(width, height) {
    try {
      const { nativeImage } = require('electron');
      if (!nativeImage || typeof nativeImage.createFromBitmap !== 'function') return null;
      const w = Math.max(8, Math.round(width || 768));
      const h = Math.max(8, Math.round(height || 1024));
      const buf = NativeImageTools._ellipseBitmap(w, h);
      const png = nativeImage.createFromBitmap(buf, { width: w, height: h }).toPNG();
      return png && png.length ? png.toString('base64') : null;
    } catch (_) {
      return null;
    }
  }

  static cropZoom(b64, frac, outW, outH) {
    try {
      const { nativeImage } = require('electron');
      const img = nativeImage.createFromBuffer(Buffer.from(b64, 'base64'));
      const s = img.getSize();
      if (!s || !s.width || !s.height) return null;
      const rect = NativeImageTools._cropRect(s, frac, outW, outH);
      const out = img.crop(rect).resize({ width: outW, height: outH, quality: 'good' }).toPNG();
      return out && out.length ? out.toString('base64') : null;
    } catch (_) {
      return null;
    }
  }

  static _ellipseBitmap(w, h) {
    const buf = Buffer.alloc(w * h * 4);
    const cx = w * RoleplayEnv.number('RP_MASK_CX', 0.5);
    const cy = h * RoleplayEnv.number('RP_MASK_CY', 0.56);
    const rx = w * RoleplayEnv.number('RP_MASK_RX', 0.20);
    const ry = h * RoleplayEnv.number('RP_MASK_RY', 0.50);
    for (let y = 0; y < h; y += 1) {
      for (let x = 0; x < w; x += 1) {
        const nx = (x - cx) / rx; const ny = (y - cy) / ry;
        const v = (nx * nx + ny * ny) <= 1 ? 255 : 0;
        const i = (y * w + x) * 4;
        buf[i] = v; buf[i + 1] = v; buf[i + 2] = v; buf[i + 3] = 255;
      }
    }
    return buf;
  }

  static _cropRect(s, frac, outW, outH) {
    const f = Math.min(1, Math.max(0.2, Number(frac) || 0.6));
    const aspect = (outW > 0 && outH > 0) ? outW / outH : s.width / s.height;
    let cw = s.width * f;
    let ch = cw / aspect;
    if (ch > s.height * f) { ch = s.height * f; cw = ch * aspect; }
    return {
      x: Math.round((s.width - cw) / 2),
      y: Math.round(Math.max(0, (s.height - ch) * 0.4)),
      width: Math.max(1, Math.round(cw)),
      height: Math.max(1, Math.round(ch)),
    };
  }
}

module.exports = NativeImageTools;
