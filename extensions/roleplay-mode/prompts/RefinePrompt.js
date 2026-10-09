const EditPromptParts = require('./EditPromptParts');

class RefinePrompt {
  static build(data, ctx) {
    const { momentEntries } = ctx;
    const whoDesc = RefinePrompt._who(momentEntries);
    return [
      EditPromptParts.styleAnchor(data),
      "Keep this image's background, scene, composition, framing and art style UNCHANGED; only fix the character.",
      RefinePrompt._keepAction(ctx),
      RefinePrompt._keepReactionFace(ctx),
      'Make the character EXACTLY match the character reference image(s): face, hair and current outfit.',
      EditPromptParts.preserveIdentity(momentEntries[0] && momentEntries[0].char),
      whoDesc ? 'Characters: ' + whoDesc + '.' : '',
      'Do not add, remove, duplicate or move any people, and do not change the setting.',
    ].filter(Boolean).join(' ');
  }

  static _keepAction({ paintedBeat, soloPaintedBeat, directorShot }) {
    if (!(paintedBeat && !soloPaintedBeat && directorShot && directorShot.action)) return '';
    return 'Keep the exact action of the moment (' + directorShot.action + ') completely unchanged; do not remove, undo or calm the action.';
  }

  static _keepReactionFace({ soloPaintedBeat, directorShot }) {
    if (!(soloPaintedBeat && directorShot && directorShot.contact)) return '';
    return 'This is an extreme close-up REACTION shot: keep the framing exactly as painted, and keep the face exactly as painted: the same wide startled eyes, the same deep blush, the same parted lips, the same smooth clean skin. Exactly one person in frame.';
  }

  static _who(entries) {
    return entries
      .map(({ char, state }) => {
        if (!char) return '';
        const look = (char.appearance || '').trim();
        const outfit = ((state && state.outfitDesc) || char.currentOutfitDesc || '').trim();
        return char.name + (look ? ' (' + look + ')' : '') + (outfit ? ', wearing ' + outfit : '');
      })
      .filter(Boolean)
      .join('. ');
  }
}

module.exports = RefinePrompt;
