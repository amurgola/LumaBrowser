const CastResolver = require('../world/CastResolver');
const CharacterProfile = require('../world/CharacterProfile');
const StoryLedger = require('../world/StoryLedger');

class PressurePrompt {
  static PASSAGE_MAX = 2500;
  static CAST_MAX = 6;

  static messages(data, content) {
    const d = data || {};
    const story = StoryLedger.of(d);
    const player = StoryLedger.protagonist(d);
    const present = CastResolver.currentEntries(d).map(({ char }) => char).slice(0, PressurePrompt.CAST_MAX);
    const cast = present.map((c) => {
      const p = CharacterProfile.of(c);
      return '- ' + c.name + (p.wants ? ': wants ' + p.wants : '') + (p.hides ? '; hides ' + p.hides : '');
    });
    const pinned = StoryLedger.pinnedThread(d);
    const system = '/no_think\n'
      + 'You are the STORY EDITOR for an interactive roleplay. Give the narrator the force that drives the story '
      + 'when the player does not. Respond with ONLY one minified JSON object, no prose, no code fences.\n'
      + 'Schema: {"pressure":string,"thread":string}\n'
      + 'Rules:\n'
      + '- pressure: "" unless the story so far already holds something that is going to happen to the player '
      + 'whatever they do next. Then ONE short sentence (at most 25 words) that says what is coming and when or '
      + 'on what condition ("... will ...", "... before ...", "... unless ..."), concrete: something already in the '
      + 'story that will come to the player if they do nothing (a character acting on what they want, a deadline, '
      + 'a consequence of what the player did). Built ONLY from the premise, the story so far and the characters '
      + 'listed: never a new person, place, event or secret. It must still be true if the player walks away from this scene: never what a '
      + 'character is doing, feeling or waiting for in the passage ("she is waiting to see if he accepts" is the '
      + 'scene, not a pressure). Not a theme, not a mood. "" when nothing in the story presses on the player yet, '
      + 'which is the usual answer early on.\n'
      + '- thread: the central question of the PREMISE (not of this scene) in one short phrase (under twelve '
      + 'words). Keep the current one unless the story has clearly moved past it.\n'
      + 'Fit the premise and tone. Never decide what the player does.';
    const user = 'Premise: ' + (d.scenario || '(none)') + '\n'
      + (d.tone ? 'Tone: ' + d.tone + '\n' : '')
      + 'The player: ' + (player.name || 'the protagonist') + (player.persona ? ' (' + player.persona + ')' : '') + '\n'
      + 'Clock: ' + StoryLedger.clockLine(d) + '\n'
      + 'Story so far: ' + (story.summary || '(just beginning)') + '\n'
      + 'Current central thread: ' + (pinned || '(none yet)') + '\n'
      + 'Other open threads: ' + (StoryLedger.openThreads(d).filter((t) => t !== pinned).join(' | ') || '(none)') + '\n'
      + 'Previous pressure: ' + (story.pressure || '(none yet)') + '\n'
      + 'In the scene now:\n' + (cast.length ? cast.join('\n') : '(nobody yet)') + '\n'
      + 'Latest passage:\n"""\n' + String(content || '').slice(0, PressurePrompt.PASSAGE_MAX) + '\n"""\n\nJSON:';
    return [{ role: 'system', content: system }, { role: 'user', content: user }];
  }

  static AHEAD = /\b(?:will|won't|unless|until|before|by (?:dawn|dusk|noon|night|morning|evening|tomorrow|tonight|the)|soon|tonight|tomorrow|at (?:dawn|dusk|noon|midnight|nightfall|sunrise|sunset)|comes? (?:for|back|due)|coming (?:for|back|due)|returns?|is due|are due|runs? out|running out|closing in|on (?:his|her|their|its) way|about to|deadline|hours? left|days? left|if (?:he|she|they|the player|nobody|no one))\b/i;
  static MOMENT = /\b(?:is|are) (?:waiting|watching|deciding|looking|standing|sitting|wondering|considering|thinking|hoping)\b|\b(?:resumes?|continues?|keeps?|remains?|goes back to|returns to (?:her|his|their) (?:work|task|sorting|routine))\b/i;

  static looksAhead(pressure) {
    const s = String(pressure || '');
    if (!s.trim()) return false;
    return PressurePrompt.AHEAD.test(s);
  }

  static DESCRIBES_SHARE = 0.6;

  static describesPassage(pressure, passage) {
    const words = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/)
      .map((w) => w.replace(/(?:ing|ed|es|s)$/, '')).filter((w) => w.length > 3);
    const mine = Array.from(new Set(words(pressure)));
    if (mine.length < 3) return false;
    const theirs = new Set(words(passage));
    return mine.filter((w) => theirs.has(w)).length / mine.length >= PressurePrompt.DESCRIBES_SHARE;
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
    const out = { pressure: String(obj.pressure || '').trim(), thread: String(obj.thread || obj.centralThread || '').trim() };
    return out;
  }
}

module.exports = PressurePrompt;
