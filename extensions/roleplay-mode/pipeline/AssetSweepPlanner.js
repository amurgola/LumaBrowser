const SceneLocator = require('../world/SceneLocator');
const CastResolver = require('../world/CastResolver');
const CharacterArt = require('../world/CharacterArt');
const AssetLedger = require('./AssetLedger');

class AssetSweepPlanner {
  static FACE_CAP = 3;

  static plan(data, { newCharIds = [], newSceneId = null } = {}) {
    const opts = (data && data.options) || {};
    return {
      sceneArtId: opts.sceneBackground ? AssetSweepPlanner._sceneArt(data, newSceneId) : null,
      faceIds: opts.autoAvatarArt ? AssetSweepPlanner._faces(data, newCharIds) : [],
      outfitBackfills: AssetSweepPlanner._outfits(data),
    };
  }

  static _sceneArt(data, newSceneId) {
    if (newSceneId) return newSceneId;
    const scene = SceneLocator.active(data);
    if (scene && !(scene.bg && scene.bg.b64) && AssetLedger.canRetry(data, 'scene:' + scene.id)) return scene.id;
    return null;
  }

  static _faces(data, newCharIds) {
    const missing = ((data && data.characters) || [])
      .filter((c) => c && c.id && !(c.art && c.art.base && c.art.base.b64))
      .map((c) => c.id)
      .filter((id) => newCharIds.indexOf(id) >= 0 || AssetLedger.canRetry(data, 'face:' + id));
    missing.sort((a, b) => (newCharIds.indexOf(b) >= 0 ? 1 : 0) - (newCharIds.indexOf(a) >= 0 ? 1 : 0));
    return missing.slice(0, Math.max(newCharIds.length, AssetSweepPlanner.FACE_CAP));
  }

  static _outfits(data) {
    const out = [];
    for (const { char } of CastResolver.currentEntries(data)) {
      const oid = char && char.currentOutfit;
      const o = oid && Array.isArray(char.outfits) && char.outfits.find((x) => x && x.id === oid);
      if (o && !o.b64 && AssetLedger.canRetry(data, 'outfit:' + o.id)) {
        out.push({ charId: char.id, outfitId: o.id, sourceRef: CharacterArt.bodyRef(char) });
      }
    }
    return out;
  }
}

module.exports = AssetSweepPlanner;
