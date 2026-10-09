class CharacterLooks {
  static EYE_COLOR = /\b((?:[a-z]+-)?(?:green|blue|brown|amber|hazel|gr[ae]y|violet|purple|red|crimson|golden|gold|teal|turquoise|silver|black|pink|orange|emerald|sapphire|jade|olive))\s+eyes\b/i;
  static MAN_WORDS = /\b(man|male|boy|guy|gentleman|masculine|bearded|beard|moustache|mustache|king|prince|husband|father|son|he|his|him)\b/;
  static WOMAN_WORDS = /\b(woman|female|girl|lady|feminine|queen|princess|wife|mother|daughter|she|her|hers)\b/;
  static BOORU_GIRL = /\b(girl|woman|women|female|she|her|hers|lady|ladies|mother|sister|daughter|queen|princess|waitress|actress|gal|maiden|witch|goddess|blouse|skirt|sundress|gown|bra|panties|lingerie|heels|bikini)\b/;
  static BOORU_BOY = /\b(boy|man|men|male|\bhe\b|him|his|guy|father|brother|son|king|prince|mister|\bsir\b|gentleman|lord|wizard|god|beard|moustache|mustache|necktie and suit trousers)\b/;

  static eyeColor(char) {
    const m = CharacterLooks.EYE_COLOR.exec((char && char.appearance) || '');
    return m ? m[0].toLowerCase() : '';
  }

  static subjectNoun(char) {
    const s = (((char && char.appearance) || '') + ' ' + ((char && char.description) || '')).toLowerCase();
    if (CharacterLooks.MAN_WORDS.test(s)) return 'man';
    if (CharacterLooks.WOMAN_WORDS.test(s)) return 'woman';
    return 'person';
  }

  static booruGender(c) {
    const t = ((c && c.appearance) || '') + ' ' + ((c && c.description) || '')
      + ' ' + ((c && c.name) || '') + ' ' + ((c && c.currentOutfitDesc) || '');
    const s = t.toLowerCase();
    if (CharacterLooks.BOORU_GIRL.test(s)) return 'girl';
    if (CharacterLooks.BOORU_BOY.test(s)) return 'boy';
    return 'other';
  }
}

module.exports = CharacterLooks;
