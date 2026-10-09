const EditPromptParts = require('./EditPromptParts');

class IntegratedScenePrompt {
  static NEGATIVE = 'extra people, duplicate character, floating body, cropped body, changed background, different room, photorealistic, 3d render';

  static build(data, { char, emotion, directorShot } = {}) {
    const shot = directorShot || {};
    const props = Array.isArray(shot.props) ? shot.props.filter(Boolean) : [];
    const prompt = [
      'Image 1 is the environment plate. Preserve its architecture, objects, camera angle, composition, and art style.',
      'Add the exact same character from image 2 naturally into that environment: the same face, the same hairstyle and hair colour, the same eye colour'
        + EditPromptParts.eyeNote(char) + ', the same outfit, one single person.',
      IntegratedScenePrompt._pose(shot, emotion),
      IntegratedScenePrompt._framing(String(shot.framing || 'full')),
      props.length ? 'Include ' + props.join(', ') + ' clearly visible in the moment.' : '',
      'Match the scene perspective and lighting, with believable contact shadows and physical placement.',
      'Exactly one character. Do not replace, crop, repaint, or redesign the environment outside the area required to place the character.',
      (data && data.style ? 'Art style: ' + String(data.style).trim() + '. ' : '')
        + '2D anime illustration, flat matte cel shading, clean hand-drawn line art.',
    ].filter(Boolean).join(' ');
    return { prompt, negativePrompt: IntegratedScenePrompt.NEGATIVE };
  }

  static _pose(shot, emotion) {
    const act = String(shot.action || '').trim();
    return 'Pose the character ' + String(shot.pose || 'standing naturally')
      + (act ? ', ' + act : '')
      + (emotion ? ', with a clearly ' + emotion + ' expression' : '') + '.';
  }

  static _framing(framing) {
    return /full|wide/i.test(framing)
      ? 'Use ' + framing + ' framing and show the complete body from head to feet.'
      : 'Use ' + framing + ' framing with a natural camera crop and anatomically coherent posture.';
  }
}

module.exports = IntegratedScenePrompt;
