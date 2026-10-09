const CastResolver = require('../world/CastResolver');
const SceneLocator = require('../world/SceneLocator');
const EmotionEnricher = require('../emotions/EmotionEnricher');
const SubjectTag = require('./SubjectTag');
const ProseCues = require('./ProseCues');

class ImagePrompt {
  static MAX_PEOPLE = 2;
  static GIST_MAX = 220;
  static SEATED_FRAMING = 'seated, sitting down, relaxed natural seated pose, full body or waist-up, looking at viewer';
  static FULL_FRAMING = 'full body, head to toe, entire figure visible, natural standing pose, looking at viewer';
  static PORTRAIT_FRAMING = 'upper body, waist-up, close to camera, looking at viewer, detailed face, sharp facial features';

  static build(data, content, opts) {
    const d = data || {};
    const text = String(content || '');
    const entries = CastResolver.forMoment(d, text);
    if (opts && opts.closeUpOf) {
      const closeUp = ImagePrompt._closeUp(d, entries, opts.closeUpOf);
      if (closeUp) return closeUp;
    }
    return ImagePrompt._moment(d, entries, text);
  }

  static _closeUp(data, entries, name) {
    const want = String(name).toLowerCase();
    const entry = entries.find((e) => String((e.char && e.char.name) || '').toLowerCase() === want) || entries[0];
    if (!entry) return '';
    const c = entry.char;
    const look = ImagePrompt._look(c);
    const emotion = ImagePrompt._emotion(entry.state);
    return [
      SubjectTag.forCast([c]),
      ImagePrompt._style(data),
      `portrait of ${c.name}${look ? ' (' + look + ')' : ''}${emotion ? ', ' + emotion : ''}`,
      'extreme close-up, face focus, the face filling the frame, looking at viewer, detailed face, detailed eyes',
      'simple background, blurry background, depth of field',
    ].filter(Boolean).join('. ');
  }

  static _moment(data, entries, text) {
    const people = ImagePrompt._people(entries);
    const scene = SceneLocator.active(data);
    const sceneLabel = SceneLocator.label(scene);
    return [
      SubjectTag.forCast(entries.map((entry) => entry.char)),
      ImagePrompt._style(data),
      people ? `featuring ${people}, shown in the scene` : '',
      sceneLabel ? `set in ${sceneLabel}` : '',
      text.replace(/[*_`#>]/g, '').replace(/\s+/g, ' ').trim().slice(0, ImagePrompt.GIST_MAX),
      people ? ImagePrompt._framing(text) : '',
      people ? 'digital artwork, detailed background' : '',
    ].filter(Boolean).join('. ');
  }

  static _people(entries) {
    return entries
      .map(({ char: c, state }) => {
        const look = ImagePrompt._look(c);
        const outfit = ((state && state.outfitDesc) || c.currentOutfitDesc || '').trim();
        const emotion = ImagePrompt._emotion(state);
        return `${c.name}${look ? ' (' + look + ')' : ''}${emotion ? ', ' + emotion : ''}${outfit ? ', wearing ' + outfit : ''}`;
      })
      .slice(0, ImagePrompt.MAX_PEOPLE)
      .join(' and ');
  }

  static _framing(text) {
    if (ProseCues.isSeated(text)) return ImagePrompt.SEATED_FRAMING;
    return ProseCues.shotType(text) === 'full' ? ImagePrompt.FULL_FRAMING : ImagePrompt.PORTRAIT_FRAMING;
  }

  static _look(c) {
    return (c.appearance && c.appearance.trim()) || '';
  }

  static _emotion(state) {
    return EmotionEnricher.enrich((state && state.emotion && String(state.emotion).trim()) || '');
  }

  static _style(data) {
    return (data.style && String(data.style).trim()) || '';
  }
}

module.exports = ImagePrompt;
