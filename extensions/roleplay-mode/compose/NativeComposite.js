const RoleplayEnv = require('../images/RoleplayEnv');

class NativeComposite {
  static DEFAULT_W = 768;
  static DEFAULT_H = 1024;

  static compose(sceneB64, charB64, width, height) {
    try {
      const { nativeImage } = require('electron');
      if (!nativeImage || typeof nativeImage.createFromBitmap !== 'function') return null;
      const W = Math.max(8, Math.round(width || NativeComposite.DEFAULT_W));
      const H = Math.max(8, Math.round(height || NativeComposite.DEFAULT_H));
      const scene = nativeImage.createFromBuffer(Buffer.from(sceneB64, 'base64')).resize({ width: W, height: H, quality: 'good' }).toBitmap();
      if (!scene || scene.length < W * H * 4) return null;
      const fig = NativeComposite._figure(nativeImage, charB64, H);
      if (!fig) return null;
      const keyed = NativeComposite._key(fig);
      NativeComposite._paste(scene, W, H, fig, keyed);
      const out = nativeImage.createFromBitmap(scene, { width: W, height: H }).toPNG();
      return out && out.length ? out.toString('base64') : null;
    } catch (_) {
      return null;
    }
  }

  static _figure(nativeImage, charB64, H) {
    const charSrc = nativeImage.createFromBuffer(Buffer.from(charB64, 'base64'));
    const cs = charSrc.getSize();
    if (!cs || !cs.width || !cs.height) return null;
    const ch = Math.max(1, Math.round(H * RoleplayEnv.number('RP_COMP_H', 0.92)));
    const cw = Math.max(1, Math.round(cs.width * (ch / cs.height)));
    return { cbm: charSrc.resize({ width: cw, height: ch, quality: 'good' }).toBitmap(), cw, ch };
  }

  static _key({ cbm, cw, ch }) {
    const thr = RoleplayEnv.number('RP_COMP_KEY', 42);
    const keyed = NativeComposite._flood(cbm, cw, ch, thr * thr);
    NativeComposite._erode(keyed, cw, ch, Math.max(0, Math.round(RoleplayEnv.number('RP_COMP_ERODE', 2))));
    return keyed;
  }

  static _flood(cbm, cw, ch, thr2) {
    const bb = cbm[0]; const bg = cbm[1]; const br = cbm[2];
    const keyed = new Uint8Array(cw * ch);
    const stack = [];
    for (let x = 0; x < cw; x += 1) { stack.push(x); stack.push((ch - 1) * cw + x); }
    for (let y = 0; y < ch; y += 1) { stack.push(y * cw); stack.push(y * cw + cw - 1); }
    while (stack.length) {
      const p = stack.pop();
      if (p < 0 || p >= keyed.length || keyed[p]) continue;
      const i = p * 4;
      const db = cbm[i] - bb; const dg = cbm[i + 1] - bg; const dr = cbm[i + 2] - br;
      if (db * db + dg * dg + dr * dr > thr2) continue;
      keyed[p] = 1;
      const x = p % cw; const y = (p - x) / cw;
      if (x + 1 < cw) stack.push(p + 1);
      if (x - 1 >= 0) stack.push(p - 1);
      if (y + 1 < ch) stack.push(p + cw);
      if (y - 1 >= 0) stack.push(p - cw);
    }
    return keyed;
  }

  static _erode(keyed, cw, ch, passes) {
    for (let e = 0; e < passes; e += 1) {
      const toKey = [];
      for (let p = 0; p < keyed.length; p += 1) {
        if (keyed[p]) continue;
        const x = p % cw; const y = (p - x) / cw;
        if ((x + 1 < cw && keyed[p + 1]) || (x - 1 >= 0 && keyed[p - 1])
          || (y + 1 < ch && keyed[p + cw]) || (y - 1 >= 0 && keyed[p - cw])) toKey.push(p);
      }
      for (let k = 0; k < toKey.length; k += 1) keyed[toKey[k]] = 1;
    }
  }

  static _paste(scene, W, H, { cbm, cw, ch }, keyed) {
    const offX = Math.round((W - cw) / 2);
    const offY = H - ch;
    for (let y = 0; y < ch; y += 1) {
      const sy = y + offY;
      if (sy < 0 || sy >= H) continue;
      for (let x = 0; x < cw; x += 1) {
        if (keyed[y * cw + x]) continue;
        const sx = x + offX;
        if (sx < 0 || sx >= W) continue;
        const si = (sy * W + sx) * 4; const ci = (y * cw + x) * 4;
        scene[si] = cbm[ci]; scene[si + 1] = cbm[ci + 1]; scene[si + 2] = cbm[ci + 2]; scene[si + 3] = 255;
      }
    }
  }
}

module.exports = NativeComposite;
