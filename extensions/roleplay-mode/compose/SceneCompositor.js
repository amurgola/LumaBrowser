const CanvasLib = require('./CanvasLib');
const FigureKeyer = require('./FigureKeyer');

class SceneCompositor {
  static DEFAULT_W = 832;
  static DEFAULT_H = 1216;
  static SOLO_FIG_H = 0.92;
  static GROUP_FIG_H = 0.82;
  static LIGHTING_STRENGTH = 0.22;
  static MAX_TINT = 0.6;
  static DEFAULT_SPREAD = 0.22;

  static async composeHero(sceneB64, bodyB64, opts = {}) {
    const W = opts.W || SceneCompositor.DEFAULT_W;
    const H = opts.H || SceneCompositor.DEFAULT_H;
    const hero = await FigureKeyer.key(bodyB64, SceneCompositor._keyOpts(opts));
    if (opts.lightingMatch !== false) {
      const ambient = await SceneCompositor._ambient(sceneB64, W, H);
      SceneCompositor._tint(hero.canvas, ambient, SceneCompositor._strength(opts));
    }
    const figH = Number.isFinite(opts.figH) ? opts.figH : SceneCompositor.SOLO_FIG_H;
    const comp = await SceneCompositor.compositeFigure(sceneB64, hero, { W, H, figH, dx: opts.dx || 0 });
    return { plateB64: comp.b64, place: comp.place };
  }

  static async composeFigures(sceneB64, figures, opts = {}) {
    const W = opts.W || SceneCompositor.DEFAULT_W;
    const H = opts.H || SceneCompositor.DEFAULT_H;
    const list = (figures || []).filter((f) => f && f.b64);
    if (!list.length) return { plateB64: sceneB64, places: [] };
    if (list.length === 1) return SceneCompositor._single(sceneB64, list[0], opts, W, H);
    const ambient = opts.lightingMatch !== false ? await SceneCompositor._ambient(sceneB64, W, H) : null;
    let plate = sceneB64;
    const places = [];
    for (const f of list) {
      const comp = await SceneCompositor._addFigure(plate, f, ambient, opts, W, H);
      plate = comp.b64;
      places.push(comp.place);
    }
    return { plateB64: plate, places };
  }

  static async compositeFigure(sceneB64, figureKeyed, { W, H, figH = SceneCompositor.SOLO_FIG_H, dx = 0, anchor = 'bottom' } = {}) {
    const scene = await CanvasLib.loadImage(sceneB64);
    const out = CanvasLib.create(W, H);
    const ctx = out.getContext('2d');
    ctx.drawImage(scene, 0, 0, W, H);
    const { canvas: fig, bbox } = figureKeyed;
    const scale = (figH * H) / bbox.h;
    const dw = Math.round(bbox.w * scale);
    const dh = Math.round(bbox.h * scale);
    const drawX = Math.round((W - dw) / 2 + dx * W);
    const drawY = anchor === 'bottom' ? (H - dh) : Math.round((H - dh) / 2);
    ctx.drawImage(fig, bbox.x, bbox.y, bbox.w, bbox.h, drawX, drawY, dw, dh);
    return { b64: CanvasLib.toB64(out), place: { x: drawX, y: drawY, w: dw, h: dh }, scale };
  }

  static spreadOffsets(n, spread = SceneCompositor.DEFAULT_SPREAD) {
    if (n <= 1) return [0];
    const out = [];
    const step = (2 * spread) / (n - 1);
    for (let i = 0; i < n; i += 1) out.push(-spread + i * step);
    return out;
  }

  static async _single(sceneB64, f, opts, W, H) {
    const hero = await SceneCompositor.composeHero(sceneB64, f.b64, Object.assign({}, opts, {
      W, H, figH: Number.isFinite(f.figH) ? f.figH : opts.figH, dx: Number.isFinite(f.dx) ? f.dx : (opts.dx || 0),
    }));
    return { plateB64: hero.plateB64, places: [hero.place] };
  }

  static async _addFigure(plate, f, ambient, opts, W, H) {
    const keyed = await FigureKeyer.key(f.b64, SceneCompositor._keyOpts(opts));
    if (ambient) SceneCompositor._tint(keyed.canvas, ambient, SceneCompositor._strength(opts));
    const figH = Number.isFinite(f.figH) ? f.figH : (Number.isFinite(opts.figH) ? opts.figH : SceneCompositor.GROUP_FIG_H);
    const dx = Number.isFinite(f.dx) ? f.dx : 0;
    return SceneCompositor.compositeFigure(plate, keyed, { W, H, figH, dx });
  }

  static _keyOpts(opts) {
    return { thr: opts.bodyThr, erode: opts.bodyErode, globalKey: opts.globalKey, despill: opts.despill };
  }

  static _strength(opts) {
    return Number.isFinite(opts.lightingStrength) ? opts.lightingStrength : SceneCompositor.LIGHTING_STRENGTH;
  }

  static async _ambient(sceneB64, W, H, region) {
    const img = await CanvasLib.loadImage(sceneB64);
    const c = CanvasLib.create(W, H);
    c.getContext('2d').drawImage(img, 0, 0, W, H);
    const x = Math.max(0, Math.round((region && region.x) || W * 0.25));
    const y = Math.max(0, Math.round((region && region.y) || H * 0.35));
    const w = Math.min(W - x, Math.round((region && region.w) || W * 0.5));
    const h = Math.min(H - y, Math.round((region && region.h) || H * 0.6));
    const d = c.getContext('2d').getImageData(x, y, w, h).data;
    let r = 0; let g = 0; let b = 0; let n = 0;
    for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; n += 1; }
    return n ? [r / n, g / n, b / n] : [128, 128, 128];
  }

  static _tint(canvas, rgb, alpha) {
    const ctx = canvas.getContext('2d');
    ctx.save();
    ctx.globalCompositeOperation = 'source-atop';
    ctx.globalAlpha = Math.max(0, Math.min(SceneCompositor.MAX_TINT, alpha));
    ctx.fillStyle = CanvasLib.rgb(rgb);
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }
}

module.exports = SceneCompositor;
