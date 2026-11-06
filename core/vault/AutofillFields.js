class AutofillFields {
  static KEYS = ['fullName', 'givenName', 'familyName', 'email', 'phone', 'organization', 'street', 'line2', 'city', 'region', 'postalCode', 'country'];

  static LABELS = {
    fullName: 'Full name', givenName: 'First name', familyName: 'Last name', email: 'Email', phone: 'Phone',
    organization: 'Company', street: 'Street address', line2: 'Apartment, suite', city: 'City', region: 'State / province',
    postalCode: 'ZIP / postal code', country: 'Country',
  };

  static AUTOCOMPLETE = {
    name: 'fullName', 'given-name': 'givenName', 'family-name': 'familyName', email: 'email', tel: 'phone',
    'tel-national': 'phone', organization: 'organization', 'street-address': 'street', 'address-line1': 'street',
    'address-line2': 'line2', 'address-level2': 'city', 'address-level1': 'region', 'postal-code': 'postalCode',
    country: 'country', 'country-name': 'country',
  };

  static PATTERNS = [
    ['email', /e-?mail/i],
    ['phone', /phone|mobile|\btel\b|telephone/i],
    ['givenName', /first.?name|given.?name|fname|forename/i],
    ['familyName', /last.?name|family.?name|surname|lname/i],
    ['organization', /company|organi[sz]ation|business.?name/i],
    ['line2', /address.?line.?2|addr.?2|address2|\bapt\b|apartment|suite|\bunit\b/i],
    ['postalCode', /zip|postal|post.?code/i],
    ['city', /\bcity\b|town|locality|suburb/i],
    ['region', /\bstate\b|province|region|county/i],
    ['country', /country/i],
    ['street', /street|address.?line.?1|addr.?1|address1|^address$|billing.?address|shipping.?address|\baddress\b/i],
    ['fullName', /full.?name|^name$|your.?name|\bname\b/i],
  ];

  static SKIP_TYPES = new Set(['password', 'hidden', 'submit', 'button', 'checkbox', 'radio', 'file', 'image', 'reset', 'search', 'range', 'color', 'date', 'number']);

  static classify(hints) {
    const h = hints || {};
    const type = String(h.type || '').toLowerCase();
    if (h.tag === 'INPUT' && AutofillFields.SKIP_TYPES.has(type)) return null;
    const tokens = String(h.autocomplete || '').toLowerCase().trim().split(/\s+/);
    const token = tokens[tokens.length - 1];
    if (AutofillFields.AUTOCOMPLETE[token]) return AutofillFields.AUTOCOMPLETE[token];
    if (type === 'email') return 'email';
    if (type === 'tel') return 'phone';
    const text = [h.name, h.id, h.placeholder, h.label].filter(Boolean).join(' ');
    if (!text || /search|captcha|coupon|promo|username|login/i.test(text)) return null;
    for (const [key, re] of AutofillFields.PATTERNS) if (re.test(text)) return key;
    return null;
  }

  static valueFor(profile, key) {
    const p = profile || {};
    if (p[key]) return String(p[key]);
    const full = String(p.fullName || '').trim();
    if (key === 'fullName') return [p.givenName, p.familyName].filter(Boolean).join(' ');
    if (key === 'givenName' && full) return full.includes(' ') ? full.slice(0, full.lastIndexOf(' ')) : full;
    if (key === 'familyName' && full.includes(' ')) return full.slice(full.lastIndexOf(' ') + 1);
    return '';
  }

  static clean(fields) {
    const out = {};
    for (const key of AutofillFields.KEYS) {
      const v = fields && fields[key] != null ? String(fields[key]).trim().slice(0, 300) : '';
      if (v) out[key] = v;
    }
    return out;
  }

  static isWorthSaving(fields) {
    const keys = Object.keys(AutofillFields.clean(fields));
    return keys.length >= 3 && (keys.includes('street') || keys.includes('email'));
  }

  static summary(profile) {
    const name = AutofillFields.valueFor(profile, 'fullName');
    return [name, profile.street, profile.city, profile.email].filter(Boolean).join(', ');
  }

  static sameProfile(a, b) {
    const eq = (k) => !!a[k] && String(a[k]).toLowerCase() === String(b[k] || '').toLowerCase();
    if (a.street || b.street) return eq('street') && (!a.postalCode || !b.postalCode || eq('postalCode'));
    return eq('email');
  }

  static covers(profile, captured) {
    return Object.entries(AutofillFields.clean(captured)).every(([k, v]) => AutofillFields.valueFor(profile, k).toLowerCase() === v.toLowerCase());
  }
}

module.exports = AutofillFields;
