const CharacterProfile = require('../world/CharacterProfile');
const StoryLedger = require('../world/StoryLedger');

class ProfilePrompt {
  static PASSAGE_MAX = 2500;

  static messages(data, char, content) {
    const d = data || {};
    const p = CharacterProfile.of(char);
    const player = StoryLedger.protagonist(d);
    const system = '/no_think\n'
      + 'You are the CASTING DIRECTOR for an interactive roleplay. Write the character profile the narrator will '
      + 'use to keep this character consistent for the whole story. Respond with ONLY one minified JSON object, no '
      + 'prose, no code fences.\n'
      + 'Schema: {"summary":string,"appearance":string,"voice":string,"wants":string,"hides":string,'
      + '"tells":[string,string],"bondUser":string}\n'
      + 'Rules:\n'
      + '- summary: who they are in one or two sentences (role, temperament, what matters to them). Keep any facts '
      + 'already given.\n'
      + '- appearance: a short comma-separated visual description (hair, build, features, age impression); keep '
      + 'the given one verbatim when there is one.\n'
      + '- voice: how they talk in two or three cues (register, rhythm, a habit) plus ONE short example line in '
      + 'quotes that only they would say.\n'
      + '- wants: what they want in this story, one phrase. hides: one thing they conceal or will not say, or "".\n'
      + '- tells: two or three physical habits that show their feeling without naming it, specific to this person '
      + '(not jaw, breath or knuckles), e.g. "rubs the scar on her thumb when lying".\n'
      + '- bondUser: their starting attitude to the player in one or two words (wary, curious, warm, hostile, '
      + 'indebted).\n'
      + 'Fit the premise and tone. Never write the player\'s profile.';
    const user = 'Premise: ' + (d.scenario || '(none)') + '\n'
      + (d.tone ? 'Tone: ' + d.tone + '\n' : '')
      + 'The player: ' + (player.name || 'the protagonist') + (player.persona ? ' (' + player.persona + ')' : '') + '\n'
      + 'Character: ' + (char && char.name ? char.name : 'Unnamed') + '\n'
      + 'Known so far: ' + (p.summary || '(nothing)') + (p.appearance ? '; looks: ' + p.appearance : '') + '\n'
      + 'Passage that introduced them:\n"""\n' + String(content || '').slice(0, ProfilePrompt.PASSAGE_MAX) + '\n"""\n\nJSON:';
    return [{ role: 'system', content: system }, { role: 'user', content: user }];
  }

  static parse(text) {
    if (!text || typeof text !== 'string') return null;
    const s = text.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/```(?:json)?/gi, '').trim();
    const a = s.indexOf('{');
    const b = s.lastIndexOf('}');
    if (a < 0 || b <= a) return null;
    let obj;
    try { obj = JSON.parse(s.slice(a, b + 1)); } catch (_) { return null; }
    if (!obj || typeof obj !== 'object') return null;
    return {
      summary: String(obj.summary || '').trim(),
      appearance: String(obj.appearance || obj.looks || '').trim(),
      voice: String(obj.voice || '').trim(),
      wants: String(obj.wants || '').trim(),
      hides: String(obj.hides || '').trim(),
      tells: Array.isArray(obj.tells) ? obj.tells.map((t) => String(t || '').trim()).filter(Boolean) : [],
      bondUser: String(obj.bondUser || obj.bond || '').trim(),
    };
  }
}

module.exports = ProfilePrompt;
