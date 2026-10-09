const CharacterArt = require('../world/CharacterArt');
const DataMigration = require('../world/DataMigration');
const StageCall = require('../stage/StageCall');
const StagingParser = require('../stage/StagingParser');
const ArtAuditor = require('../audit/ArtAuditor');
const TurnChannel = require('../pipeline/TurnChannel');
const AssetOutcomes = require('../pipeline/AssetOutcomes');
const OutfitRenderer = require('../pipeline/OutfitRenderer');
const ReactionImageRenderer = require('../pipeline/ReactionImageRenderer');

class RoleplayDebug {
  constructor(chat) {
    this._chat = chat;
  }

  async reaction(payload) {
    return RoleplayDebug._guard('debugReaction failed', async () => {
      const data = (payload && payload.data) || {};
      data.images = data.images || {};
      const messageId = 'dbg_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      let captured = null;
      const turn = new TurnChannel({ emit: (type, p) => { if (type === 'mode:image') captured = p; }, setMeta: async () => {}, messageId });
      await new ReactionImageRenderer(this._chat).render({
        data, content: (payload && payload.content) || '', directorShot: (payload && payload.directorShot) || null, turn,
      });
      const img = (data.images && data.images[messageId]) || captured;
      return { ok: !!(img && img.b64), b64: img && img.b64, mime: img && img.mime };
    });
  }

  async outfit(payload) {
    return RoleplayDebug._guard('debugOutfit failed', async () => {
      const data = (payload && payload.data) || {};
      const { charId, outfitId } = payload || {};
      const c = (data.characters || []).find((x) => x && x.id === charId);
      const outfit = c && Array.isArray(c.outfits) && c.outfits.find((o) => o && o.id === outfitId);
      if (!c || !outfit) return { ok: false, error: 'character/outfit not found in supplied data' };
      const outcomes = new AssetOutcomes(data);
      const ok = await this._exclusive(() => new OutfitRenderer(this._chat).render(
        data, { charId, outfitId, sourceRef: CharacterArt.bodyRef(c) },
        { turn: new TurnChannel({ messageId: 'dbg-outfit' }), outcomes },
      ));
      return {
        ok, failKey: outcomes.lastFailKey, b64: outfit.b64 || null, mime: outfit.mime || 'image/png',
        figureB64: (c.figure && c.figure.b64) || null,
      };
    });
  }

  async staging(payload) {
    return RoleplayDebug._guard('debugStaging failed', async () => {
      const data = (payload && payload.data) || {};
      const r = await this._chat.complete(StageCall.request(data, (payload && payload.content) || ''));
      const parsed = r && r.text ? StagingParser.parse(r.text) : null;
      return { ok: true, staging: parsed, shot: (parsed && parsed.shot) || null };
    });
  }

  async audit(payload) {
    return RoleplayDebug._guard('debugAudit failed', async () => {
      const data = (payload && payload.data) || {};
      DataMigration.migrate(data);
      const visionOk = typeof this._chat.visionAvailable === 'function' ? this._chat.visionAvailable(data.llmModel || null) : false;
      const changed = await new ArtAuditor(this._chat).auditPending(data);
      return { ok: true, visionOk, changed, pending: (data.pendingArtAudit || []).length, voided: RoleplayDebug._artState(data) };
    });
  }

  async _exclusive(fn) {
    await this._chat.beginExclusiveImage();
    try { return await fn(); } finally { this._chat.endExclusiveImage(); }
  }

  static _artState(data) {
    return (data.characters || []).map((c) => ({
      id: c.id,
      figure: !!(c.figure && c.figure.b64),
      base: !!(c.art && c.art.base && c.art.base.b64),
      outfits: (c.outfits || []).map((o) => ({ id: o.id, hasB64: !!o.b64 })),
    }));
  }

  static async _guard(fallback, fn) {
    try { return await fn(); } catch (e) { return { ok: false, error: (e && e.message) || fallback }; }
  }
}

module.exports = RoleplayDebug;
