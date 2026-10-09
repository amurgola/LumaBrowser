const EmotionCatalog = require('../emotions/EmotionCatalog');
const EditPromptParts = require('./EditPromptParts');

class EmotionReferencePrompt {
  static build(char, emotion) {
    const full = EmotionCatalog.bucketCue(emotion) || (emotion ? `a clearly ${emotion} expression` : 'a neutral expression');
    const cue = String(full).split(':')[0].trim();
    return [
      'Change ONLY the facial expression of the person in Image 1 to ' + cue + '.',
      'Keep the exact same face shape, identity, eye colour' + EditPromptParts.eyeNote(char) + ', hairstyle, hair colour and skin, the same person with the same eyes.',
      EditPromptParts.accessoryClause(char),
    ].filter(Boolean).join(' ');
  }
}

module.exports = EmotionReferencePrompt;
