const CharacterProfile = require('../world/CharacterProfile');
const CharacterChronicle = require('../world/CharacterChronicle');
const CastResolver = require('../world/CastResolver');
const StoryLedger = require('../world/StoryLedger');

class ConsolidatePrompt {
  static ARC_WORDS = '80 to 150 words';
  static SUMMARY_WORDS = '150 to 350 words';
  static HEADINGS = ['Where we are', 'What has happened', 'What each present character wants right now', 'Open threads', 'Facts that must not change'];

  static foldMessages(data, char, beats) {
    const p = CharacterProfile.of(char);
    const ch = CharacterChronicle.of(char);
    const others = Object.entries(p.bonds).filter(([k]) => k !== CharacterProfile.BOND_USER).map(([k, v]) => k + ': ' + v);
    const system = '/no_think\n'
      + 'You keep the character records of an interactive roleplay. Fold the listed beats into this character\'s '
      + 'rolling arc and update the growth fields. Respond with ONLY one minified JSON object, no prose, no fences.\n'
      + 'Schema: {"arc":string,"wants":string,"hides":string,"bondUser":string,"bonds":{"<name>":string}}\n'
      + 'Rules:\n'
      + '- arc: ' + ConsolidatePrompt.ARC_WORDS + ', past tense, third person, names not pronouns. Merge the previous '
      + 'arc with the new beats: keep every fact still true (promises, injuries, who knows what, debts), drop '
      + 'what later beats made stale, never invent.\n'
      + '- wants: what they want NOW given everything so far (may differ from the start). hides: what they still '
      + 'conceal, or "" once it is out. bondUser: their standing attitude to the player in one or two words.\n'
      + '- bonds: their standing with each OTHER character the beats involve, one short line per name (keep the '
      + 'known ones unless the beats changed them; add a name only when the beats show a relation). {} when none.\n'
      + '- Growth is welcome and must be earned by the beats; identity (looks, past, voice, tells) is not yours to change.';
    const user = 'Character: ' + char.name + '\n'
      + 'Summary: ' + (p.summary || '(none)') + '\n'
      + 'Wants: ' + (p.wants || '(unknown)') + ' | Hides: ' + (p.hides || '(nothing)') + ' | Toward the player: ' + (CharacterProfile.bondWithUser(char) || '(unknown)') + '\n'
      + 'With others: ' + (others.length ? others.join('; ') : '(none known)') + '\n'
      + 'Previous arc: ' + (ch.arc || '(none yet)') + '\n'
      + 'Beats to fold (oldest first):\n' + beats.map((b) => '- ' + b.text).join('\n') + '\n\nJSON:';
    return [{ role: 'system', content: system }, { role: 'user', content: user }];
  }

  static summaryMessages(data, rows) {
    const d = data || {};
    const story = StoryLedger.of(d);
    const present = CastResolver.currentEntries(d).map(({ char }) => char.name + (CharacterProfile.of(char).wants ? ' (wants: ' + CharacterProfile.of(char).wants + ')' : ''));
    const system = '/no_think\n'
      + 'You keep the story record of an interactive roleplay. Rewrite the story-so-far summary so the narrator can '
      + 'continue with the older turns removed. Write ' + ConsolidatePrompt.SUMMARY_WORDS + ' of plain prose under '
      + 'these exact headings, in this order, every heading present ("(none)" when empty):\n'
      + ConsolidatePrompt.HEADINGS.map((h, i) => (i + 1) + '. ' + h).join('\n') + '\n'
      + 'Keep every fact from the previous summary that is still true, fold in the new events, drop what they made '
      + 'stale. Names, not pronouns. Past tense for what happened, present for where things stand. The player is '
      + '"the player". Output only the summary.';
    const user = 'Premise: ' + (d.scenario || '(none)') + '\n'
      + 'Clock: ' + StoryLedger.clockLine(d) + '\n'
      + 'Present now: ' + (present.length ? present.join('; ') : '(none)') + '\n'
      + 'Open threads: ' + (StoryLedger.openThreads(d).join(' | ') || '(none)') + '\n'
      + 'Previous summary:\n' + (story.summary || '(none yet)') + '\n'
      + 'New events since then (oldest first):\n' + rows.map((r) => '- [' + r.kind + '] ' + r.text).join('\n') + '\n\nSummary:';
    return [{ role: 'system', content: system }, { role: 'user', content: user }];
  }

  static parseFold(text, knownNames = null) {
    if (!text || typeof text !== 'string') return null;
    const s = text.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/```(?:json)?/gi, '').trim();
    const a = s.indexOf('{');
    const b = s.lastIndexOf('}');
    if (a < 0 || b <= a) return null;
    let obj;
    try { obj = JSON.parse(s.slice(a, b + 1)); } catch (_) { return null; }
    if (!obj || typeof obj !== 'object' || !String(obj.arc || '').trim()) return null;
    return {
      arc: String(obj.arc).trim(),
      wants: obj.wants === undefined || obj.wants === null ? undefined : String(obj.wants).trim(),
      hides: obj.hides === undefined || obj.hides === null ? undefined : String(obj.hides).trim(),
      bondUser: obj.bondUser === undefined || obj.bondUser === null ? undefined : String(obj.bondUser).trim(),
      bonds: ConsolidatePrompt._bonds(obj.bonds, knownNames),
    };
  }

  static _bonds(raw, knownNames) {
    const out = {};
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
    const known = Array.isArray(knownNames) ? knownNames.filter(Boolean) : null;
    for (const [k, v] of Object.entries(raw)) {
      let key = String(k || '').trim();
      const text = String(v || '').trim();
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

  static parseSummary(text) {
    if (!text || typeof text !== 'string') return '';
    return text.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/```[a-z]*/gi, '').trim();
  }
}

module.exports = ConsolidatePrompt;
