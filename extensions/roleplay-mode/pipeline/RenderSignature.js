const CastResolver = require('../world/CastResolver');
const SceneLocator = require('../world/SceneLocator');
const CharacterArt = require('../world/CharacterArt');
const OutfitText = require('../world/OutfitText');
const ReactionEmotion = require('../emotions/ReactionEmotion');
const PoseCatalog = require('../prompts/PoseCatalog');
const ProseCues = require('../prompts/ProseCues');
const ImageProfiles = require('../images/ImageProfiles');
const RoleplayEnv = require('../images/RoleplayEnv');

class RenderSignature {
  static of(data, content, directorShot) {
    const entries = CastResolver.orderByFocus(CastResolver.forMoment(data, content), directorShot).slice(0, RoleplayEnv.castMax());
    const scene = SceneLocator.active(data);
    return JSON.stringify({
      scene: (scene && scene.id) || null,
      sceneArtBytes: String((scene && scene.bg && scene.bg.b64) || '').length,
      pose: PoseCatalog.resolve(directorShot, content).key,
      frame: ProseCues.shotType(content),
      close: !!(directorShot && directorShot.framing === 'close'),
      config: ImageProfiles.renderConfigRevision(data),
      cast: entries.map(({ char, state }) => RenderSignature._castMember(char, state, content)),
    });
  }

  static _castMember(char, state, content) {
    return {
      id: char.id,
      outfitId: (state && state.outfitId) || char.currentOutfit || null,
      outfit: OutfitText.normalize((state && state.outfitDesc) || char.currentOutfitDesc || ''),
      emotion: ReactionEmotion.detect(state, content) || 'neutral',
      accessories: {
        head: (state && state.headAccessories) || null,
        face: (state && state.faceAccessories) || null,
      },
      artBytes: String(CharacterArt.bodyRefForState(char, state) || '').length,
    };
  }
}

module.exports = RenderSignature;
