const PixelPost = require('../pixel/PixelPost');

class AssetPostChain {
  static async apply(buf, job) {
    if (job.pixel && job.outW) return AssetPostChain._pixelArt(buf, job);
    const outW = job.outW || job.width;
    const outH = job.outH || job.height;
    if (job.alpha || job.width !== outW || job.height !== outH) return AssetPostChain._smooth(buf, job, outW, outH);
    return { buf, keyed: null };
  }

  static async _pixelArt(buf, job) {
    const report = {};
    const small = await PixelPost.pixelArtProcess(buf, job.logicalW || job.outW, job.logicalH || job.outH, {
      transparent: !!job.alpha, report, upscaleTo: { width: job.outW, height: job.outH },
    });
    return { buf: small || buf, keyed: AssetPostChain._keyed(job, small, report) };
  }

  static async _smooth(buf, job, outW, outH) {
    const report = {};
    const out = await PixelPost.smoothProcess(buf, outW, outH, { transparent: !!job.alpha, report });
    return { buf: out || buf, keyed: AssetPostChain._keyed(job, out, report) };
  }

  static _keyed(job, result, report) {
    return job.alpha ? !!(result && report.keyed) : null;
  }
}

module.exports = AssetPostChain;
