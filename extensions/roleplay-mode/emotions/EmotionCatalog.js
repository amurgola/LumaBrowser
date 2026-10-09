const RAW = require('../emotions.catalog.json');

class EmotionCatalog {
  static CATEGORY_BUCKET = {
    'Anger 😠': 'angry',
    'Smile 😊': 'happy',
    'Smug 😏': 'happy',
    'Surprise 😲': 'surprised',
    'Emotional 😢': 'sad',
    'Sexual 🔥': 'embarrassed',
    'Focus/Thought 🤔': null,
    'Pain/Ailment 🤕': 'sad',
    'Emotes 🤪': null,
  };
  static STOP = new Set([
    'the', 'and', 'with', 'character', 'looks', 'their', 'face', 'eyes', 'mouth',
    'expression', 'small', 'open', 'closed', 'slightly', 'soft', 'tense', 'has',
    'into', 'from', 'over', 'down', 'they', 'them', 'while', 'like', 'show', 'shows',
  ]);
  static BUCKET_CUE = Object.freeze({
    angry: 'a furious scowl: eyebrows pulled sharply down and together, eyes narrowed into a hard glare, '
      + 'nostrils flared, mouth a tight snarl or bared teeth, jaw clenched, definitely NOT smiling',
    sad: 'open grief: inner eyebrows raised and pulled together, eyes downcast and glistening with tears, '
      + 'mouth corners pulled down into a frown, chin trembling, NOT smiling',
    happy: 'a beautiful smile: corners of the mouth raised, cheeks lifted, eyes softly crinkled',
    surprised: 'a startled, surprised look: eyebrows raised high, eyes opened wide, mouth dropping open '
      + 'with parted lips, NOT smiling',
    embarrassed: 'a shy, embarrassed look: a soft blush across the cheeks, eyes glancing down and away, '
      + 'a small bashful closed-mouth smile or a flustered parted mouth',
  });
  static MIN_SCORE = 3;
  static LEAD_TAGS = 4;

  static _entries = null;

  static entries() {
    if (!EmotionCatalog._entries) EmotionCatalog._entries = EmotionCatalog._build();
    return EmotionCatalog._entries;
  }

  static lookup(text) {
    const toks = EmotionCatalog._tokenize(text);
    if (!toks.size) return null;
    let best = null;
    let bestScore = 0;
    for (const entry of EmotionCatalog.entries()) {
      const score = EmotionCatalog._score(entry, toks);
      if (score > bestScore) { bestScore = score; best = entry; }
    }
    return bestScore >= EmotionCatalog.MIN_SCORE ? best : null;
  }

  static enrichBooru(text) {
    const e = String(text || '').trim();
    if (!e) return '';
    const m = EmotionCatalog.lookup(e);
    return m && m.booru ? `${e}, ${m.booru}` : e;
  }

  static bucketFor(text) {
    const m = EmotionCatalog.lookup(text);
    return m ? m.bucket : null;
  }

  static bucketCue(bucket) {
    return (bucket && EmotionCatalog.BUCKET_CUE[bucket]) || '';
  }

  static _build() {
    const out = [];
    for (const category of Object.keys(RAW)) {
      for (const e of Array.isArray(RAW[category]) ? RAW[category] : []) {
        if (e && e.safe_name) out.push(EmotionCatalog._entry(category, e));
      }
    }
    return out;
  }

  static _entry(category, e) {
    const booru = String(e.description || '').trim();
    const leadTags = booru.split(',').slice(0, EmotionCatalog.LEAD_TAGS).join(' ');
    const name = e.safe_name.replace(/-/g, ' ');
    return {
      name: e.safe_name,
      category,
      bucket: Object.prototype.hasOwnProperty.call(EmotionCatalog.CATEGORY_BUCKET, category)
        ? EmotionCatalog.CATEGORY_BUCKET[category] : null,
      booru,
      natural: String(e.natural_prompt || '').trim(),
      primary: EmotionCatalog._tokenize(e.key, name, leadTags),
      all: EmotionCatalog._tokenize(e.key, name, booru),
    };
  }

  static _score(entry, toks) {
    let score = 0;
    for (const t of toks) {
      if (entry.primary.has(t)) score += 3;
      else if (entry.all.has(t)) score += 1;
    }
    return score;
  }

  static _tokenize(...parts) {
    const out = new Set();
    for (const p of parts) {
      if (!p) continue;
      for (const w of String(p).toLowerCase().split(/[^a-z]+/)) {
        if (w.length >= 3 && !EmotionCatalog.STOP.has(w)) out.add(w);
      }
    }
    return out;
  }
}

module.exports = EmotionCatalog;
