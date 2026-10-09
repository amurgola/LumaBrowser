const CoordinateSpace = require('./CoordinateSpace');
const GroundingReplyParser = require('./GroundingReplyParser');
const GroundingProfiles = require('./GroundingProfiles');

class GroundingClient {
  static DEFAULT_MAX_LONG_EDGE = 1568;
  static DEFAULT_MAX_SHIFT = 24;

  constructor({ complete, imageOps, profile } = {}) {
    if (typeof complete !== 'function') throw new Error('GroundingClient: complete() is required');
    if (!imageOps) throw new Error('GroundingClient: imageOps is required');
    this.complete = complete;
    this.imageOps = imageOps;
    this.profile = typeof profile === 'object' && profile ? profile : GroundingProfiles.getProfile(profile);
  }

  static sentSizeFor(profile, width, height) {
    if (profile.factor) {
      return CoordinateSpace.smartResize(width, height, {
        factor: profile.factor, minPixels: profile.minPixels, maxPixels: profile.maxPixels,
      });
    }
    const cap = profile.maxLongEdge || GroundingClient.DEFAULT_MAX_LONG_EDGE;
    const k = Math.min(1, cap / Math.max(width, height));
    return { width: Math.max(1, Math.round(width * k)), height: Math.max(1, Math.round(height * k)) };
  }

  async pass(image, instruction) {
    const { width, height } = this.imageOps.size(image);
    const sent = GroundingClient.sentSizeFor(this.profile, width, height);
    const messages = this._buildMessages(image, instruction, { width, height }, sent);
    const t0 = Date.now();
    let raw = '';
    try {
      raw = String(await this.complete(messages, { ...this.profile.request }) || '');
    } catch (e) {
      return { ok: false, raw, sent, ms: Date.now() - t0, error: e.message };
    }
    return this._interpretReply(raw, sent, { width, height }, Date.now() - t0);
  }

  async locate({ image, instruction, zoom = false }) {
    if (!instruction || !String(instruction).trim()) {
      return { ok: false, passes: [], ms: 0, error: 'instruction is required' };
    }
    const t0 = Date.now();
    const coarse = await this.pass(image, instruction);
    const passes = [{ stage: 'coarse', ...coarse }];
    if (!coarse.ok || !zoom) return { ...coarse, passes, ms: Date.now() - t0 };
    return this._refine(image, instruction, coarse, passes, typeof zoom === 'object' ? zoom : {}, t0);
  }

  _buildMessages(image, instruction, size, sent) {
    const unchanged = sent.width === size.width && sent.height === size.height;
    const sendImg = unchanged ? image : this.imageOps.resize(image, sent.width, sent.height);
    return this.profile.buildMessages({ instruction, dataUrl: this.imageOps.toDataUrl(sendImg), sent });
  }

  _interpretReply(raw, sent, { width, height }, ms) {
    const parsed = GroundingReplyParser.parse(raw);
    if (!parsed) return { ok: false, raw, sent, ms, error: 'no coordinates in reply' };
    if (parsed.infeasible) return { ok: false, infeasible: true, raw, sent, ms, error: 'model reports the target is not visible' };
    const toImage = (p) => this._toImage(p, sent, width / sent.width, height / sent.height);
    const point = CoordinateSpace.clampPoint(toImage(parsed.point), width, height);
    let bbox;
    if (parsed.bbox) {
      const a = toImage({ x: parsed.bbox[0], y: parsed.bbox[1] });
      const b = toImage({ x: parsed.bbox[2], y: parsed.bbox[3] });
      bbox = [a.x, a.y, b.x, b.y];
    }
    return { ok: true, point, bbox, raw, sent, ms };
  }

  _toImage(point, sent, fx, fy) {
    const s = CoordinateSpace.modelToSent(point, this.profile.coordFormat, sent);
    return { x: s.x * fx, y: s.y * fy };
  }

  async _refine(image, instruction, coarse, passes, opts, t0) {
    const { width, height } = this.imageOps.size(image);
    const win = CoordinateSpace.zoomWindow(coarse.point, width, height, opts);
    if (win.width >= width && win.height >= height) return { ...coarse, passes, ms: Date.now() - t0 };
    const fine = await this.pass(this.imageOps.crop(image, win), instruction);
    passes.push({ stage: 'zoom', window: win, ...fine });
    if (!fine.ok) return { ...coarse, passes, ms: Date.now() - t0, refined: false };
    return GroundingClient._acceptRefine(coarse, fine, win, passes, opts, t0);
  }

  static _acceptRefine(coarse, fine, win, passes, opts, t0) {
    const point = { x: fine.point.x + win.x, y: fine.point.y + win.y };
    const maxShift = opts.maxShift != null ? opts.maxShift : GroundingClient.DEFAULT_MAX_SHIFT;
    const shift = Math.hypot(point.x - coarse.point.x, point.y - coarse.point.y);
    passes[passes.length - 1].shift = Math.round(shift);
    if (shift > maxShift) {
      return { ...coarse, passes, ms: Date.now() - t0, refined: false, rejectedShift: Math.round(shift) };
    }
    const bbox = fine.bbox
      ? [fine.bbox[0] + win.x, fine.bbox[1] + win.y, fine.bbox[2] + win.x, fine.bbox[3] + win.y]
      : undefined;
    return { ok: true, point, bbox, passes, ms: Date.now() - t0, refined: true };
  }
}

module.exports = GroundingClient;
