const ProseSlop = require('../prompts/ProseSlop');
const NarratorBrief = require('../prompts/NarratorBrief');
const SpeakerNames = require('../prompts/SpeakerNames');

class ProseScore {
  static BANDS = Object.freeze({ snappy: [40, 120], balanced: [120, 250], lush: [250, 400] });
  static HANDOFF = /(?:\?|"|\.|!)\s*$/;
  static TRAILING_SUMMARY = /\b(?:and so|in the end|little did|would never be the same|as the night wore on|the adventure (?:had )?begun)\b[^.]*\.\s*$/i;

  static run({ data, transcript }) {
    const band = ProseScore.BANDS[NarratorBrief.lengthMode(data)] || ProseScore.BANDS.balanced;
    const replies = (transcript || []).map((t) => ProseScore.reply(t.assistant, band));
    const n = replies.length || 1;
    const words = replies.map((r) => r.words);
    return {
      replies,
      perHundred: ProseScore._round(replies.reduce((s, r) => s + r.perHundred, 0) / n),
      inBand: ProseScore._round(replies.filter((r) => r.inBand).length / n),
      tagged: ProseScore._round(replies.filter((r) => r.tagged).length / n),
      handoff: ProseScore._round(replies.filter((r) => r.handoff).length / n),
      words: { min: words.length ? Math.min(...words) : 0, max: words.length ? Math.max(...words) : 0, avg: Math.round(words.reduce((s, w) => s + w, 0) / n) },
      band,
    };
  }

  static reply(text, band) {
    const s = String(text || '');
    const score = ProseSlop.score(s);
    const trimmed = s.trim();
    return {
      words: score.words,
      perHundred: score.perHundred,
      hits: score.hits.map((h) => h.phrase),
      inBand: score.words >= band[0] && score.words <= band[1],
      tagged: SpeakerNames.parse(s).length > 0,
      handoff: ProseScore.HANDOFF.test(trimmed) && !ProseScore.TRAILING_SUMMARY.test(trimmed),
    };
  }

  static _round(v) {
    return Math.round(v * 100) / 100;
  }
}

module.exports = ProseScore;
