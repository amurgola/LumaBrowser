class BodySignals {
  static WORD_NUMBERS = {
    one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11,
    twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
    twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
  };
  static DECADES = { sixties: 65, seventies: 75, eighties: 85, nineties: 92 };
  static TALL_CM = 195;
  static SHORT_CM = 155;

  static tags(text) {
    const s = String(text || '').toLowerCase();
    const out = [];
    const age = BodySignals.age(s);
    const band = age == null ? '' : BodySignals.ageBand(age);
    if (band) out.push(band);
    const cm = BodySignals.heightCm(s);
    if (cm && (age == null || age >= 16)) {
      if (cm >= BodySignals.TALL_CM) out.push('sizeverytall');
      else if (cm <= BodySignals.SHORT_CM) out.push('sizeshort');
    }
    return out;
  }

  static age(s) {
    const num = '(\\d{1,3}|(?:' + Object.keys(BodySignals.WORD_NUMBERS).join('|') + ')(?:[ -](?:one|two|three|four|five|six|seven|eight|nine))?)';
    const m = s.match(new RegExp(num + '[ -]?(?:years?|yrs?)[ -]?old'))
      || s.match(new RegExp('\\baged? ' + num + '\\b'))
      || s.match(new RegExp('\\bage ' + num + '\\b'));
    if (m) return BodySignals._number(m[1]);
    const d = s.match(/\bin (?:her|his|their|its) (?:late |early |mid )?(sixties|seventies|eighties|nineties)\b/);
    return d ? BodySignals.DECADES[d[1]] : null;
  }

  static ageBand(age) {
    if (age < 1) return '';
    if (age <= 3) return 'agetoddler';
    if (age <= 7) return 'ageyoungchild';
    if (age <= 12) return 'agechild';
    if (age <= 17) return 'ageteen';
    if (age >= 75) return 'ageadvanced';
    if (age >= 60) return 'ageolder';
    return '';
  }

  static heightCm(s) {
    const cm = s.match(/\b(\d{3})\s?cm\b/);
    if (cm) return Number(cm[1]);
    const m = s.match(/\b([12]\.\d{1,2})\s?m\b/);
    if (m) return Math.round(Number(m[1]) * 100);
    const ft = s.match(/\b([4-7])\s?(?:'|ft|foot|feet)\s?(\d{1,2})?\b/);
    if (ft) return Math.round(Number(ft[1]) * 30.48 + (Number(ft[2]) || 0) * 2.54);
    return null;
  }

  static _number(token) {
    if (/^\d+$/.test(token)) return Number(token);
    return String(token).split(/[ -]/).reduce((n, w) => n + (BodySignals.WORD_NUMBERS[w] || 0), 0) || null;
  }
}

module.exports = BodySignals;
