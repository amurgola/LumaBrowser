const RegionPromptHint = require('../../../../../image-server/prompt/RegionPromptHint');
const NativeBitmapCodec = require('../../../../../image-server/region/NativeBitmapCodec');
const RegionComposite = require('../../../../../image-server/region/RegionComposite');
const RegionCrop = require('../../../../../image-server/region/RegionCrop');
const RegionMaskPrep = require('../../../../../image-server/region/RegionMaskPrep');

class EditRegion {
  static NONE = 'none';

  static resolve({ params, artifactId, index }) {
    const raw = params ? params.regionId : undefined;
    if (raw === false || raw === null || EditRegion._isNone(raw) || !index) return { region: null };
    if (typeof raw === 'string' && raw.trim()) {
      const region = index.get(raw.trim());
      if (!region) return { error: `edit_image: marked region "${raw.trim()}" not found; the artifact catalog lists each marked region's id.` };
      if (region.artifactId !== artifactId) {
        return { error: `edit_image: region "${region.id}" was marked on image ${region.artifactId}, not on ${artifactId}; pass that image as artifactId, or "none" as regionId.` };
      }
      return { region };
    }
    return { region: index.currentFor(artifactId) };
  }

  static prepare({ region, srcBuf, srcDims }) {
    const dims = srcDims || { width: region.width, height: region.height };
    const prepared = RegionMaskPrep.prepare({ maskPng: region.mask, width: dims.width, height: dims.height });
    const crop = prepared ? EditRegion._crop(prepared, srcBuf, dims) : null;
    return new EditRegion({ region, srcBuf, srcDims: dims, prepared, crop });
  }

  static _crop(prepared, srcBuf, dims) {
    const rect = RegionCrop.box({ bounds: prepared.bounds, width: dims.width, height: dims.height });
    if (!rect) return null;
    const png = RegionCrop.cutPng({ sourceBytes: srcBuf, rect });
    return png ? { rect, png } : null;
  }

  constructor({ region, srcBuf, srcDims, prepared, crop }) {
    this._region = region;
    this._srcBuf = srcBuf;
    this._srcDims = srcDims || null;
    this._prepared = prepared || null;
    this._crop = crop || null;
  }

  get id() {
    return this._region.id;
  }

  get note() {
    return this._region.note || '';
  }

  get coverage() {
    if (this._prepared) return this._prepared.coverage;
    return typeof this._region.coverage === 'number' ? this._region.coverage : null;
  }

  get composites() {
    return !!this._prepared;
  }

  get cropped() {
    return !!this._crop;
  }

  get cropRect() {
    return this._crop ? this._crop.rect : null;
  }

  get canvasDims() {
    return this._crop ? { width: this._crop.rect.width, height: this._crop.rect.height } : this._srcDims;
  }

  sourceBytes() {
    return this._crop ? this._crop.png : this._srcBuf;
  }

  sourceBase64() {
    return this.sourceBytes().toString('base64');
  }

  inpaintMask() {
    if (!this._prepared) return NativeBitmapCodec.toBuffer(this._region.mask);
    if (!this._crop) return this._prepared.inpaintPng;
    return RegionMaskPrep.inpaintPng(this._prepared.grown, this._crop.rect) || this._prepared.inpaintPng;
  }

  promptHint() {
    const dims = this.canvasDims;
    if (!this._prepared) return RegionPromptHint.build({ bounds: null, width: dims.width, height: dims.height, coverage: this.coverage });
    const b = this._prepared.bounds;
    const rect = this._crop ? this._crop.rect : { x: 0, y: 0, width: dims.width, height: dims.height };
    const bounds = { x: b.x - rect.x, y: b.y - rect.y, width: b.width, height: b.height };
    const scale = (this._srcDims.width * this._srcDims.height) / (rect.width * rect.height);
    return RegionPromptHint.build({ bounds, width: rect.width, height: rect.height, coverage: Math.min(1, this.coverage * scale) });
  }

  finish(image) {
    if (!this._prepared || !image || !image.bytes) return { ...image, composited: false };
    const out = RegionComposite.apply({
      sourceBytes: this._srcBuf,
      outputBytes: image.bytes,
      grown: this._prepared.grown,
      featherPx: this._prepared.featherPx,
      rect: this.cropRect,
    });
    if (!out) return { ...image, composited: false };
    return { ...image, bytes: out.bytes, mime: out.mime, width: out.width, height: out.height, composited: true };
  }

  summary(composited) {
    const share = typeof this.coverage === 'number' ? `, about ${Math.max(1, Math.round(this.coverage * 100))}% of the image` : '';
    const note = this.note ? ` ("${this.note}")` : '';
    const crop = this._crop ? `; edited on a ${this._crop.rect.width}x${this._crop.rect.height} close-up around the area, enlarged for detail` : '';
    const outcome = composited
      ? 'the source is restored pixel for pixel outside it'
      : 'the result could NOT be composited back onto the source (no bitmap codec), so the whole render is kept';
    return `; confined to marked region ${this.id}${note}${share}${crop}; ${outcome}`;
  }

  static _isNone(raw) {
    return typeof raw === 'string' && raw.trim().toLowerCase() === EditRegion.NONE;
  }
}

module.exports = EditRegion;
