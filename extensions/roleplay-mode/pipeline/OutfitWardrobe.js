const OutfitText = require('../world/OutfitText');
const CharacterArt = require('../world/CharacterArt');
const RoleplayIds = require('../world/RoleplayIds');

class OutfitWardrobe {
  static ensure(char, outfitDesc, pendingOutfits, slots) {
    if (!char || !outfitDesc) return false;
    char.outfits = Array.isArray(char.outfits) ? char.outfits : [];
    const match = char.outfits.find((o) => OutfitWardrobe._matches(o, outfitDesc, slots));
    if (match) return OutfitWardrobe._reuse(char, match, slots);
    const sourceRef = CharacterArt.bodyRef(char);
    const outfit = {
      id: RoleplayIds.mint('outfit'), name: OutfitText.displayName(outfitDesc), desc: outfitDesc,
      slots: slots || null, b64: null, mime: 'image/png',
    };
    char.outfits.push(outfit);
    char.currentOutfit = outfit.id;
    pendingOutfits.push({ charId: char.id, outfitId: outfit.id, sourceRef });
    return true;
  }

  static _matches(o, outfitDesc, slots) {
    if (!o) return false;
    const bySlots = OutfitText.sameSlots(o.slots, slots);
    return bySlots !== null ? bySlots : OutfitText.same(o.desc, outfitDesc);
  }

  static _reuse(char, match, slots) {
    if (slots && !match.slots) match.slots = slots;
    if (char.currentOutfit === match.id) return false;
    char.currentOutfit = match.id;
    return true;
  }
}

module.exports = OutfitWardrobe;
