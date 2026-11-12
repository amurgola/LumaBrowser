const CharacterProfile = require('../world/CharacterProfile');
const StoryLedger = require('../world/StoryLedger');

class ProfilePrompt {
  static PASSAGE_MAX = 2500;
  static CAST_MAX = 8;

  static messages(data, char, content) {
    const d = data || {};
    const p = CharacterProfile.of(char);
    const player = StoryLedger.protagonist(d);
    const cast = ProfilePrompt.castLines(d, char);
    const system = '/no_think\n'
      + 'You are the CASTING DIRECTOR for an interactive roleplay. Write the character profile the narrator will '
      + 'use to keep this character consistent for the whole story. Respond with ONLY one minified JSON object, no '
      + 'prose, no code fences.\n'
      + 'Schema: {"summary":string,"appearance":string,"history":string,"voice":string,"wants":string,"hides":string,'
      + '"tells":[string,string],"bondUser":string,"bonds":{"<cast name>":string}}\n'
      + 'Rules:\n'
      + '- summary: who they are in one or two sentences (role, temperament, what matters to them). Keep any facts '
      + 'already given.\n'
      + '- appearance: a short comma-separated visual description (hair, build, features, age impression); keep '
      + 'the given one verbatim when there is one.\n'
      + '- history: ONE plain sentence of who they were before the story began, ordinary and in keeping with the '
      + 'premise and the passage. No tragedy, dead relatives, crimes or mysteries unless the premise or the passage '
      + 'says so. "" when nothing is known.\n'
      + '- voice: how they talk in two or three cues (register, rhythm, a habit) plus ONE short example line in '
      + 'quotes that only they would say.\n'
      + '- wants: what they want right now in this story, one plain phrase taken from how they act in the passage. '
      + 'hides: "" unless the premise or the passage clearly shows they conceal something, then that one thing.\n'
      + '- tells: two or three physical habits that show their feeling without naming it, specific to this person '
      + '(not jaw, breath or knuckles), e.g. "rubs the scar on her thumb when lying".\n'
      + '- bondUser: their starting attitude to the player in one or two words (wary, curious, warm, hostile, '
      + 'indebted).\n'
      + '- bonds: one short line per OTHER cast member listed below ONLY when the passage itself shows how this '
      + 'character relates to them (e.g. "her older sister"); never invent a relationship. {} when none, which is '
      + 'the usual answer. Keys are the exact cast names.\n'
      + '- Make them unlike the rest of the cast: a different role, register and want from every character listed '
      + 'below.\n'
      + 'Stay inside what the premise and the passage establish: this card keeps the character consistent, it is '
      + 'not a place to add plot. Fit the premise and tone. Never write the player\'s profile.';
    const user = 'Premise: ' + (d.scenario || '(none)') + '\n'
      + (d.tone ? 'Tone: ' + d.tone + '\n' : '')
      + 'The player: ' + (player.name || 'the protagonist') + (player.persona ? ' (' + player.persona + ')' : '') + '\n'
      + 'Character: ' + (char && char.name ? char.name : 'Unnamed') + '\n'
      + 'Known so far: ' + (p.summary || '(nothing)') + (p.appearance ? '; looks: ' + p.appearance : '') + '\n'
      + 'The rest of the cast:\n' + (cast.length ? cast.join('\n') : '(nobody yet)') + '\n'
      + 'Passage that introduced them:\n"""\n' + String(content || '').slice(0, ProfilePrompt.PASSAGE_MAX) + '\n"""\n\nJSON:';
    return [{ role: 'system', content: system }, { role: 'user', content: user }];
  }

  static castLines(data, char) {
    const chars = Array.isArray(data && data.characters) ? data.characters : [];
    const lines = [];
    for (const c of chars) {
      if (!c || !c.name || c === char || (char && c.id && c.id === char.id)) continue;
      const q = CharacterProfile.of(c);
      const bits = ['- ' + c.name + (q.summary ? ': ' + q.summary : '')];
      if (q.voice) bits.push('voice: ' + q.voice);
      if (q.wants) bits.push('wants: ' + q.wants);
      lines.push(bits.join('; '));
      if (lines.length >= ProfilePrompt.CAST_MAX) break;
    }
    return lines;
  }

  static parse(text, knownNames = null) {
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
      history: String(obj.history || obj.background || obj.past || '').trim(),
      voice: String(obj.voice || '').trim(),
      wants: String(obj.wants || '').trim(),
      hides: ProfilePrompt.NOTHING.test(String(obj.hides || '').trim()) ? '' : String(obj.hides || '').trim(),
      tells: Array.isArray(obj.tells) ? obj.tells.map((t) => String(t || '').trim()).filter(Boolean) : [],
      bondUser: String(obj.bondUser || obj.bond || '').trim(),
      bonds: ProfilePrompt._bonds(obj.bonds, knownNames),
    };
  }

  static NOTHING = /^[\s("']*(?:nothing(?: [a-z ]+)?|none(?: [a-z ]+)?|n\/?a|unknown|not (?:known|applicable|stated))[\s)."']*$/i;

  static _bonds(raw, knownNames) {
    const out = {};
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
    const known = Array.isArray(knownNames) ? knownNames.filter(Boolean) : null;
    for (const [k, v] of Object.entries(raw)) {
      const text = String(v || '').trim();
      let key = String(k || '').trim();
      if (!key || !text || key.toLowerCase() === CharacterProfile.BOND_USER) continue;
      if (known) {
        const match = known.find((n) => String(n).toLowerCase() === key.toLowerCase());
        if (!match) continue;
        key = match;
      }
      out[key] = text;
    }
    return out;
  }
}

module.exports = ProfilePrompt;
