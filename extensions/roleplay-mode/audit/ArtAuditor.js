const ArtAuditQueue = require('./ArtAuditQueue');
const ArtAuditPrompt = require('./ArtAuditPrompt');
const ArtAuditVerdict = require('./ArtAuditVerdict');
const AssetLedger = require('../pipeline/AssetLedger');
const ImageProfiles = require('../images/ImageProfiles');
const HostGlobals = require('../HostGlobals');
const RpDebug = require('../images/RpDebug');

class ArtAuditor {
  static PER_TURN = 2;
  static TIMEOUT_MS = 90000;

  constructor(chat) {
    this._chat = chat;
  }

  async auditPending(data) {
    const q = Array.isArray(data.pendingArtAudit) ? data.pendingArtAudit : [];
    if (!q.length) return false;
    if (!ArtAuditQueue.enabled(data)) {
      data.pendingArtAudit = [];
      return false;
    }
    if (!this._canAuditNow(data)) return false;
    const batch = q.splice(0, Math.min(ArtAuditor.PER_TURN, ImageProfiles.resolve(data).auditLimit));
    let changed = false;
    for (const item of batch) {
      if (await this._auditOne(data, item)) changed = true;
    }
    return changed;
  }

  _canAuditNow(data) {
    const lab = HostGlobals.lab();
    if (lab && lab.active) return false;
    return typeof this._chat.visionAvailable === 'function' && !!this._chat.visionAvailable(data.llmModel || null);
  }

  async _auditOne(data, item) {
    const char = (data.characters || []).find((c) => c && c.id === item.charId);
    const b64 = ArtAuditor._assetB64(item, char);
    if (!char || !b64) return false;
    const v = await this._ask(data, item, char, b64);
    if (!ArtAuditVerdict.usable(v) && !item.retried) {
      ArtAuditQueue.add(data, Object.assign({}, item, { retried: true }));
      return false;
    }
    if (!ArtAuditVerdict.isBad(v, item)) return false;
    ArtAuditor._void(data, item, char);
    RpDebug.log('audit.voided', { kind: item.kind, char: char.name, problems: (v && v.problems) || null });
    return true;
  }

  async _ask(data, item, char, b64) {
    const started = Date.now();
    try {
      const r = await this._chat.complete({
        messages: ArtAuditPrompt.messages(item, char),
        images: [{ kind: 'image', base64: b64, mime: 'image/png' }],
        temperature: 0, timeoutMs: ArtAuditor.TIMEOUT_MS, noThink: true,
        modelRef: data.llmModel || undefined,
      });
      const v = r && r.text ? ArtAuditVerdict.parse(r.text) : null;
      RpDebug.log('audit.verdict', { kind: item.kind, char: char.name, ms: Date.now() - started, verdict: v, error: (r && r.error) || null });
      return v;
    } catch (e) {
      RpDebug.log('audit.error', { kind: item.kind, char: char.name, error: e && e.message });
      return null;
    }
  }

  static _assetB64(item, char) {
    if (!char) return null;
    if (item.kind === 'outfit') return ((char.outfits || []).find((o) => o && o.id === item.outfitId) || {}).b64;
    if (item.kind === 'figure') return char.figure && char.figure.b64;
    return char.art && char.art.base && char.art.base.b64;
  }

  static _void(data, item, char) {
    if (item.kind === 'outfit') {
      const o = (char.outfits || []).find((x) => x && x.id === item.outfitId);
      if (o) { o.b64 = null; o.mime = null; }
      AssetLedger.noteFail(data, 'outfit:' + item.outfitId);
    } else if (item.kind === 'figure') {
      char.figure = null;
      AssetLedger.noteFail(data, 'figure:' + item.charId);
    } else {
      char.art = Object.assign({}, char.art, { base: null });
      AssetLedger.noteFail(data, 'face:' + item.charId);
    }
    if (char.art && char.art.figures) char.art.figures = {};
    data.options = data.options || {};
    data.options.artRevision = (Number(data.options.artRevision) || 0) + 1;
  }
}

module.exports = ArtAuditor;
