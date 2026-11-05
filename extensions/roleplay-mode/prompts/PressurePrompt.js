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
      + '- pressure: ONE sentence, present tense, concrete: who or what is moving toward the player right now, '
      + 'how soon, and what it costs them if they stall (an antagonist closing in, a deadline, a secret about to '
      + 'surface, a debt coming due). Something a character can act on in the next scene. Not a theme, not a mood.\n'
      + '- thread: the central question of the premise in one short phrase (under twelve words), the hook the whole '
      + 'story keeps returning to. Keep the current one unless the story has clearly moved past it.\n'
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
    return out.pressure || out.thread ? out : null;
  }
}

module.exports = PressurePrompt;
