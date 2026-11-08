class BodyDetailScore {
  static WORDS = [
    'sweat', 'sweaty', 'sweating', 'smell', 'smells', 'smelled', 'stink', 'stinks', 'reek', 'reeks', 'odour', 'odor',
    'musk', 'musky', 'breath', 'blood', 'bloody', 'bleeding', 'skin', 'callus', 'calluses', 'calloused', 'blister',
    'blisters', 'pores', 'armpit', 'armpits', 'saliva', 'spit', 'drool', 'vomit', 'bile', 'urine', 'piss', 'bowels',
    'toenail', 'toenails', 'knuckles', 'veins', 'pruned', 'puckered', 'clammy', 'grime', 'grimy', 'greasy', 'pus',
    'bruise', 'bruised', 'scab', 'scar', 'stubble', 'sinew', 'tendons', 'flushed', 'goosebumps', 'gooseflesh',
  ];

  static run({ transcript } = {}) {
    const set = new Set(BodyDetailScore.WORDS);
    let hits = 0;
    let words = 0;
    const replies = (transcript || []).map((t) => {
      const tokens = String(t.assistant || '').toLowerCase().match(/[a-z']+/g) || [];
      const found = tokens.filter((w) => set.has(w));
      hits += found.length;
      words += tokens.length;
      return { turn: t.turn, hits: found.length, perHundred: BodyDetailScore._rate(found.length, tokens.length), found: [...new Set(found)] };
    });
    return { perHundred: BodyDetailScore._rate(hits, words), hits, words, replies };
  }

  static _rate(hits, words) {
    return words ? Math.round((hits / words) * 1000) / 10 : 0;
  }
}

module.exports = BodyDetailScore;
