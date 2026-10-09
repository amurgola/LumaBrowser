const CanvasLib = require('./CanvasLib');
const BorderClusters = require('./BorderClusters');

class BackdropProbe {
  static STRICT_RED_RATIO = 0.6;

  static async sample(b64) {
    const canvas = await CanvasLib.fromB64(b64);
    const W = canvas.width;
    const H = canvas.height;
    const d = canvas.getContext('2d').getImageData(0, 0, W, H).data;
    const clusters = BorderClusters.find(d, W, H);
    const dom = clusters[0] || { r: d[0], g: d[1], b: d[2], frac: 1 };
    const greenDominant = BorderClusters.isGreenDominant(dom.r, dom.g, dom.b);
    return {
      rgb: [Math.round(dom.r), Math.round(dom.g), Math.round(dom.b)],
      greenDominant,
      strictChroma: greenDominant && dom.r < dom.g * BackdropProbe.STRICT_RED_RATIO,
      clusters,
    };
  }

  static async trySample(b64) {
    try { return await BackdropProbe.sample(b64); } catch (_) { return null; }
  }
}

module.exports = BackdropProbe;
