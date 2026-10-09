const EmotionCatalog = require('./EmotionCatalog');

class EmotionEnricher {
  static FALLBACKS = [
    [/\b(shock|surpris|startl|caught off guard|stunned|aghast|taken aback)\b/, ', surprised expression, wide eyes, open mouth, raised eyebrows, blush'],
    [/\b(angr|furious|fuming|mad|seething|irritat|annoy)\b/, ', angry expression, furrowed brows, glaring, gritted teeth'],
    [/\b(upset|distress|frustrat|hurt|dismay)\b/, ', upset expression, furrowed brows, frowning'],
    [/\b(sad|cry|tear|sorrow|grief|weep|somber|heartbroken)\b/, ', sad expression, teary eyes, downcast, frowning'],
    [/\b(joy|jump|ecsta|thrill|elat|overjoy|excit|glee|cheer)\b/, ', joyful expression, big bright smile, sparkling eyes'],
    [/\b(happy|smil|delight|pleased|content|warm)\b/, ', happy expression, warm smile'],
    [/\b(embarrass|flustered|shy|bashful|blush)\b/, ', flustered, blushing, looking away'],
  ];

  static enrich(e) {
    const s = String(e || '').toLowerCase();
    if (!s) return '';
    const fromCatalog = EmotionCatalog.enrichBooru(e);
    if (fromCatalog !== e) return fromCatalog;
    const hit = EmotionEnricher.FALLBACKS.find(([re]) => re.test(s));
    return hit ? e + hit[1] : e;
  }
}

module.exports = EmotionEnricher;
