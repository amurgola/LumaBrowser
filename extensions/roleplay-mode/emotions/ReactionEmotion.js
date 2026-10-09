const EmotionCatalog = require('./EmotionCatalog');

class ReactionEmotion {
  static RULES = [
    ['surprised', /\b(surprised|shock|shocked|startled|startle|gasp|stunned|taken aback|caught off guard|astonished|aghast)\b/],
    ['embarrassed', /\b(embarrass|embarrassed|blush|blushing|flustered|bashful|shy|sheepish)\b/],
    ['angry', /\b(angry|furious|upset|mad|rage|irritated|annoyed|glare|scowl|seethe|shout|yell)\b/],
    ['sad', /\b(sad|cry|tears|sorrow|grief|somber|miserable|heartbroken|frown|tremble)\b/],
    ['happy', /\b(happy|smile|smiling|grin|laugh|delight|joy|cheer|relieved|pleased|excited|elated)\b/],
  ];

  static detect(state, content) {
    const t = String((state && state.emotion) || content || '').toLowerCase();
    const rule = ReactionEmotion.RULES.find(([, re]) => re.test(t));
    if (rule) return rule[0];
    return EmotionCatalog.bucketFor(String((state && state.emotion) || '')) || null;
  }
}

module.exports = ReactionEmotion;
