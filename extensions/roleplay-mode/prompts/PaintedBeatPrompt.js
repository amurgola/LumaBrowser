const ImagePrompt = require('./ImagePrompt');

class PaintedBeatPrompt {
  static SOLO_NEGATIVE = 'duplicate, clone, twins, identical person twice, 2girls, 2boys, extra person, second person, crowd, '
    + 'person in background, distant figure, background people, full body, wide shot, standing figure, multiple views, '
    + 'tears, crying, streaming tears, sobbing';

  static build(data, animaPrompt, directorShot, momentEntries) {
    const act = (directorShot.action || '').trim();
    if (momentEntries.length === 1 && directorShot.contact) {
      return PaintedBeatPrompt._reactionShot(data, act, momentEntries[0].char);
    }
    const beatBits = PaintedBeatPrompt._actionBits(act, directorShot);
    return beatBits ? animaPrompt + '. ' + beatBits : animaPrompt;
  }

  static _reactionShot(data, act, focusChar) {
    const beatBits = [
      'solo, alone in frame',
      /\bkiss/i.test(act)
        ? 'the instant after a kiss, deep blush, wide surprised eyes, parted lips'
        : 'leaning in toward the viewer, deep blush, intimate expression',
    ].join('. ');
    return ImagePrompt.build(data, '', { closeUpOf: (focusChar && focusChar.name) || undefined }) + '. ' + beatBits;
  }

  static _actionBits(act, shot) {
    return [
      act,
      /\bkiss/i.test(act) ? 'kiss, kissing, faces close together, eye contact' : '',
      (shot.props && shot.props.length) ? 'with ' + shot.props.join(', ') + ' clearly visible' : '',
      shot.framing === 'close' ? 'intimate close-up framing, faces large in frame, detailed faces' : '',
    ].filter(Boolean).join('. ');
  }
}

module.exports = PaintedBeatPrompt;
