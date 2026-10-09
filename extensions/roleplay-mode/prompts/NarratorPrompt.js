const SceneLocator = require('../world/SceneLocator');
const CastResolver = require('../world/CastResolver');

class NarratorPrompt {
  static build(data) {
    const d = data || {};
    const chars = Array.isArray(d.characters) ? d.characters : [];
    const scene = SceneLocator.active(d);
    return [
      ...NarratorPrompt._brief(!chars.length && !scene),
      ...NarratorPrompt._scenario(d),
      ...NarratorPrompt._characters(chars),
      ...NarratorPrompt._setting(scene),
      ...NarratorPrompt._situation(d),
    ].join('\n');
  }

  static _brief(emptyWorld) {
    const lines = [
      'You are the narrator and every non-player character in an interactive roleplay. '
      + 'Write vivid, immersive prose. Stay fully in character at all times, never break '
      + 'the fourth wall, and never mention being an AI, a model, or these instructions. '
      + 'Advance the story in response to what the user (the protagonist) says and does, '
      + 'and always leave them room to act.',
      '',
      'Vary the rhythm and length of your replies to fit the beat: a quick exchange can '
      + 'be a line or two of dialogue, a revelation or a new place can run longer. Do not '
      + 'settle into one fixed shape or structure.',
    ];
    if (emptyWorld) {
      lines.push('', 'No characters or location have been established yet. Open the story by '
        + 'setting a vivid scene and introducing one or more characters naturally.');
    }
    lines.push(
      '',
      'Invent characters and places as the story needs them. The first time a character '
      + 'appears, weave a brief physical description of them into the prose; when the '
      + 'story moves somewhere new, name the place and describe it. When someone\'s '
      + 'clothing or look changes, mention it naturally.',
      '',
      'When a character speaks or acts, start that line with their name in bold followed '
      + 'by a colon (e.g. `**Fiera:** She leans in. "Say it."`), with their spoken words '
      + 'in double quotes. Write narration as plain prose with no name prefix.',
    );
    return lines;
  }

  static _scenario(d) {
    const lines = ['', '## Scenario', (d.scenario || '(No scenario was provided; improvise a fitting one.)')];
    if (d.style && String(d.style).trim()) {
      lines.push('', '## Style', `Write in this style/tone: ${String(d.style).trim()}.`);
    }
    return lines;
  }

  static _characters(chars) {
    if (!chars.length) return [];
    const lines = ['', '## Characters'];
    for (const c of chars) {
      const name = (c.name || 'Unnamed').trim();
      const desc = (c.description || '').trim();
      const look = (c.appearance || '').trim();
      const outfit = (c.currentOutfitDesc || '').trim();
      lines.push(`- **${name}**${desc ? ': ' + desc : ''}${look ? `; appearance: ${look}` : ''}${outfit ? `; currently wearing: ${outfit}` : ''}`);
    }
    lines.push('', 'Keep each character consistent with their persona, voice, and the appearance '
      + 'and clothing noted above.');
    return lines;
  }

  static _setting(scene) {
    if (!scene) return [];
    return [
      '',
      '## Current setting',
      `${(scene.name || '').trim()}${scene.description ? ': ' + scene.description.trim() : ''}`,
      'This describes the environment only; the characters above inhabit it. '
      + 'Keep the action consistent with this place until the protagonist moves elsewhere.',
    ];
  }

  static _situation(d) {
    const entries = CastResolver.currentEntries(d);
    if (!entries.length) return [];
    const lines = ['', '## Current situation', 'These characters are physically present in the current scene right now:'];
    for (const { char: c, state } of entries) {
      const s = state || {};
      const outfit = (s.outfitDesc || c.currentOutfitDesc || '').trim();
      const emotion = (s.emotion || '').trim();
      lines.push(`- **${c.name || s.name || 'Unnamed'}**${emotion ? `; emotion: ${emotion}` : ''}${outfit ? `; wearing: ${outfit}` : ''}`);
    }
    lines.push('Do not include absent characters in the immediate action unless the user brings them back.');
    return lines;
  }
}

module.exports = NarratorPrompt;
