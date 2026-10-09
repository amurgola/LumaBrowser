class ProseCues {
  static FULL_BODY_BEAT = /\b(stands?|standing|stood|rises?|rose|lunges?|charges?|leaps?|leapt|jumps?|kicks?|punch(?:es)?|swings?|draws?\s+(?:her|his|their|its)?\s*(?:sword|blade|weapon|bow|gun|dagger)|raises?\s+(?:her|his|their|its)?\s*(?:weapon|sword|fist|arm)|attacks?|attacking|fights?|fighting|runs?|ran|dashes?|sprints?|dances?|dancing|kneels?|crouch(?:es)?|full[-\s]body|head\s*to\s*toe|strides?|steps?\s+forward|squares?\s+up|battle|combat|bows?\s+(?:low|deeply)|spins?|twirls?|poses?)\b/;
  static SEATED = /\b(sit|sits|sitting|seated|sat|perch(?:ed|es)?|loung(?:e|es|ing)|reclin(?:e|es|ing)|kneel(?:s|ing)?|curled up|cross-?legged|legs? crossed|crossed (?:her|his|their)? ?legs?)\b/i;
  static MOVEMENT_VERBS = /\b(went|walk(?:ed|s)?|head(?:ed|s)?|arrive[ds]?|enter(?:ed|s)?|step(?:ped|s)? (?:in|into|out|through)|leave[sd]?|left|cross(?:ed)?|travel(?:l?ed|s)?|approach(?:ed|es)?|reach(?:ed|es)?|return(?:ed|s)?|move[ds]? to|made (?:their|his|her|its) way|set off|now (?:in|at)|find (?:yourself|themselves)|to the\b)/;
  static PLACE_WORDS = /\b(room|hall|street|forest|tavern|inn|castle|market|harbou?r|dock|bridge|cave|gate|chamber|courtyard|alley|shore|camp|village|town|city|clearing|corridor|doorway|threshold)\b/;
  static OUTFIT_WORDS = /\b(put|puts|putting|pull(?:s|ed|ing)?|slip(?:s|ped|ping)?|throw(?:s|n)?|wrap(?:s|ped)?|don(?:s|ned)?|wears?|wearing|dress(?:es|ed|ing)?|dressed\s+(?:up|down|for)|undress|strip(?:s|ped|ping)?|change[sd]?(?:\s+(?:into|clothes|outfit|too|as well))?|fresh\s+(?:clothes|outfit)|take[sd]? off|takes? off|took off|remove[sd]?|shrug(?:s|ged)? (?:off|out of)|unbutton|unbuttoned|unzip|unclasp|loosen(?:s|ed|ing)?|by evening|restaurant|dinner|formal|black[-\s]?tie|naked|nude|topless|bare|underwear|lingerie|robe|towel|jacket|coat|cloak|suit|tie|shirt|blouse|dress|gown|skirt|pants|trousers|armor|armour|gloves|boots|hat|helmet|bra|panties)\b/;

  static shotType(content) {
    return ProseCues.FULL_BODY_BEAT.test(String(content || '').toLowerCase()) ? 'full' : 'portrait';
  }

  static isSeated(content) {
    return ProseCues.SEATED.test(String(content || ''));
  }

  static movementHint(content) {
    const t = String(content || '').toLowerCase();
    return ProseCues.MOVEMENT_VERBS.test(t) || ProseCues.PLACE_WORDS.test(t);
  }

  static outfitHint(content) {
    return ProseCues.OUTFIT_WORDS.test(String(content || '').toLowerCase());
  }
}

module.exports = ProseCues;
