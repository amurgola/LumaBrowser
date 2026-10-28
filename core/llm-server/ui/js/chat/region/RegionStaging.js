import RegionEditor from './RegionEditor.js';
import ChatIcons from '../ChatIcons.js';
import AttachmentStrip from '../composer/AttachmentStrip.js';
import Dialogs from '../../dialogs/Dialogs.js';
import HtmlEscaper from '../../format/HtmlEscaper.js';

export default class RegionStaging {
  static UNSUPPORTED = 'Marking an area needs a canvas, which this page cannot draw on.';
  static CHIP_PREFIX = 'Area · ';

  constructor(ctx) {
    this._ctx = ctx;
    this._editor = new RegionEditor();
  }

  async markArtifact(artifact) {
    if (!artifact || !artifact.id) return;
    if (!this._supported()) return;
    const entry = await this._ctx.mediaCache.load(artifact.id);
    if (!entry) { Dialogs.alert('The image bytes could not be loaded.'); return; }
    const { state } = this._ctx;
    const index = state.attachments.findIndex((f) => f && f.kind === 'region' && f.artifactId === artifact.id);
    const existing = index >= 0 ? state.attachments[index] : null;
    const result = await this._editor.open({ dataUrl: entry.dataUrl, title: artifact.title || 'Image', existing });
    if (!result) return;
    if (index >= 0) state.attachments.splice(index, 1);
    if (!result.removed) state.attachments.push(RegionStaging.chip(artifact, result));
    this._ctx.attachments.render();
    this._after(result);
  }

  _after(result) {
    if (result.send) { this._ctx.sender.submit(this._ctx.composer.text()); return; }
    this._ctx.composer.focus();
  }

  async edit(index) {
    const f = this._ctx.state.attachments[index];
    if (!f) return;
    if (f.kind === 'region') { await this.markArtifact({ id: f.artifactId, title: f.title }); return; }
    if (f.kind !== 'image' || !this._supported()) return;
    const src = AttachmentStrip.previewSrc(f);
    if (!src) { Dialogs.alert('This image cannot be previewed, so no area can be marked on it.'); return; }
    const result = await this._editor.open({ dataUrl: src, title: f.name || 'Image', existing: f.region || null });
    if (!result) return;
    f.region = result.removed ? null : RegionStaging.region(result);
    this._ctx.attachments.render();
    this._after(result);
  }

  static chip(artifact, result) {
    return { kind: 'region', artifactId: artifact.id, title: artifact.title || 'Image', name: RegionStaging.CHIP_PREFIX + (artifact.title || 'Image'), ...RegionStaging.region(result) };
  }

  static region({ mask, note, coverage, width, height, preview }) {
    return { mask, note: note || '', coverage, width, height, preview };
  }

  static chipHtml(f, i) {
    const esc = HtmlEscaper.escape;
    const src = typeof f.preview === 'string' && /^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(f.preview) ? f.preview : '';
    return '<span class="cm-att cm-att-region' + (src ? ' has-preview' : '') + '" tabindex="0" title="' + esc(RegionStaging.describe(f)) + '">'
      + (src ? '<img class="cm-att-thumb" src="' + src + '" alt=""><span class="cm-att-preview" aria-hidden="true"><img src="' + src + '" alt=""></span>' : '')
      + '<span class="cm-att-ic">' + ChatIcons.brush + '</span>'
      + '<span class="cm-att-name">' + esc(f.name || RegionStaging.CHIP_PREFIX + (f.title || 'Image')) + '</span>'
      + '<span class="cm-att-sz">' + esc(RegionStaging.share(f.coverage)) + '</span>'
      + '<button class="cm-att-x cm-att-region-edit" data-att-region="' + i + '" type="button" title="Change the marked area">' + ChatIcons.edit + '</button>'
      + '<button class="cm-att-x" data-att-rm="' + i + '" type="button" title="Remove">×</button>'
      + '</span>';
  }

  static imageButtonHtml(f, i) {
    const esc = HtmlEscaper.escape;
    const has = !!(f && f.region);
    const title = has ? 'Marked area: ' + (f.region.note || 'no note') + ' (' + RegionStaging.share(f.region.coverage) + '). Click to change' : 'Mark an area to edit';
    return '<button class="cm-att-x cm-att-region-btn' + (has ? ' has-region' : '') + '" data-att-region="' + i + '" type="button" title="' + esc(title) + '">' + ChatIcons.brush + '</button>';
  }

  static describe(f) {
    const note = f.note ? ': ' + f.note : '';
    return 'Marked area on ' + (f.title || 'the image') + note + ' (' + RegionStaging.share(f.coverage) + ')';
  }

  static share(coverage) {
    return typeof coverage === 'number' && Number.isFinite(coverage) ? Math.max(1, Math.round(coverage * 100)) + '% of the image' : 'area';
  }

  _supported() {
    if (RegionEditor.supported()) return true;
    Dialogs.alert(RegionStaging.UNSUPPORTED);
    return false;
  }
}
