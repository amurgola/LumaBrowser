class ProseSlop {
  static PHRASES = [
    'a testament to', 'testament to', 'tapestry', 'weave', 'wove', 'delve', 'kaleidoscope', 'symphony of', 'a dance of',
    'ministrations', 'barely above a whisper', 'barely audible', 'shivers down', 'shiver down', 'the air was thick with',
    'the air thick with', 'palpable', 'bustling', 'nestled', 'labyrinthine', 'bioluminescent', 'eyes glinted', 'glinting',
    'twinkled', 'thrummed', 'flickered', 'rasped', 'chuckles darkly', 'chuckled darkly', 'eyes never leaving',
    'cold and calculating', 'body and soul', 'humble abode', 'moth to a flame', 'maybe, just maybe', 'that was enough',
    'they would face it together', 'a reminder', 'was only just beginning', 'camaraderie', 'dust motes', 'metallic tang',
    'took a deep breath', 'heart pounding in', 'casting long shadows', 'dipped below the horizon', 'playing on her lips',
    'playing on his lips', 'days turned into weeks', 'felt like an eternity', 'words hung in the air', 'brow furrowed',
    'heart skipped a beat', 'renewed sense of purpose', 'unlike anything', 'a beat.', 'a pause.', 'tasting the word',
    'jaw tightened', 'jaw tightening', 'jaw clenched', 'breath caught', 'breath catching', 'breath hitched',
    'knuckles whitened', 'knuckles whitening', 'knuckles white', 'sandalwood', 'ozone', 'a sound between',
    'somewhere between a', '"mine."', 'the weight of',
  ];
  static STOCK_NAMES = ['Elara', 'Lyra', 'Kael', 'Jaxon', 'Eldoria', 'Oakhaven', 'Whisperwood', 'Ravenswood', 'Seraphina', 'Thorne'];
  static NOT_BUT = /\b(?:not|isn't|wasn't|weren't|aren't)\s+(?:just\s+|merely\s+|only\s+)?[^.,;]{1,40},?\s+but\s+(?:rather\s+|also\s+)?/gi;
  static DOESNT_JUST = /\b(?:doesn't|don't|didn't)\s+just\b/gi;

  static hits(text) {
    const s = String(text || '');
    const lower = s.toLowerCase();
    const found = [];
    const taken = [];
    const phrases = ProseSlop.PHRASES.slice().sort((a, b) => b.length - a.length);
    for (const phrase of phrases) {
      let i = lower.indexOf(phrase);
      while (i >= 0) {
        if (!taken.some(([a, b]) => i < b && i + phrase.length > a)) {
          found.push({ phrase, index: i });
          taken.push([i, i + phrase.length]);
        }
        i = lower.indexOf(phrase, i + phrase.length);
      }
    }
    for (const m of s.matchAll(ProseSlop.NOT_BUT)) found.push({ phrase: 'not X but Y', index: m.index });
    for (const m of s.matchAll(ProseSlop.DOESNT_JUST)) found.push({ phrase: "doesn't just X", index: m.index });
    for (const name of ProseSlop.STOCK_NAMES) {
      const re = new RegExp('\\b' + name + '\\b');
      const m = re.exec(s);
      if (m) found.push({ phrase: 'stock name ' + name, index: m.index });
    }
    return found.sort((a, b) => a.index - b.index);
  }

  static wordCount(text) {
    const words = String(text || '').trim().split(/\s+/).filter(Boolean);
    return words.length;
  }

  static score(text) {
    const hits = ProseSlop.hits(text);
    const words = ProseSlop.wordCount(text);
    return { hits, words, perHundred: words ? Math.round((hits.length / words) * 10000) / 100 : 0 };
  }

  static flaggedParagraphs(text) {
    const paras = String(text || '').split(/\n{2,}/);
    const out = [];
    paras.forEach((p, i) => { if (ProseSlop.hits(p).length) out.push({ index: i, text: p }); });
    return out;
  }
}

module.exports = ProseSlop;
