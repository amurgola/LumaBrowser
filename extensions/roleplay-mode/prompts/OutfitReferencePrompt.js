const OutfitText = require('../world/OutfitText');
const EditPromptParts = require('./EditPromptParts');

class OutfitReferencePrompt {
  static NEGATIVE = '3d render, cgi, octane render, blender, realistic, photorealistic, photo, glossy, plastic skin';

  static build(data, char, outfit, hasSourceRef) {
    const outfitDesc = outfit && outfit.desc ? OutfitText.renderDesc(outfit.desc) : '';
    return [
      EditPromptParts.styleAnchor(data),
      hasSourceRef ? 'Image 1 is the existing character reference.' : '',
      OutfitReferencePrompt._swap(outfitDesc),
      'solo, full body character reference, head to toe, standing',
      EditPromptParts.CHROMA_BG,
      EditPromptParts.PROPORTIONS + ', the body filling most of the frame',
      EditPromptParts.CAMERA,
      'a relaxed neutral standing pose, the entire new outfit clearly visible, every garment clean, intact and in good condition',
      hasSourceRef
        ? 'Keep the same person, face and hair (but the clothing is fully replaced as described). ' + EditPromptParts.preserveIdentity(char)
        : 'create a complete full-body character design from the face and description',
      OutfitReferencePrompt._subject(char),
      '2D anime illustration, flat matte cel shading, clean hand-drawn line art, a single flat stylised 2D drawing of one character',
      outfitDesc ? 'wearing exactly: ' + outfitDesc + ', none of the previous clothes remaining' : '',
      EditPromptParts.CHROMA_REMINDER,
    ].filter(Boolean).join(', ');
  }

  static _swap(outfitDesc) {
    if (!outfitDesc) return '';
    return 'Completely remove and replace ALL of the existing clothing; dress this exact person in a brand-new outfit: ' + outfitDesc
      + '. Every previous garment is gone and replaced, brand-new and intact with smooth unbroken fabric; show the whole new outfit clearly from head to toe.';
  }

  static _subject(char) {
    return [char && char.appearance, char && char.description].filter(Boolean).join(', ') || (char && char.name);
  }
}

module.exports = OutfitReferencePrompt;
