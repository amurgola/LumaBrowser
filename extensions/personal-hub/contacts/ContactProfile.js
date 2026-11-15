const BirthDate = require('./BirthDate');

class ContactProfile {
  static PERSON = 'person';
  static GENERAL = 'general';
  static KINDS = [
    {
      kind: 'person', label: 'Person', fields: [
        { key: 'relation', label: 'Relation to you', type: 'text', hint: 'Ex-wife, manager at Acme, landlord' },
        { key: 'birthday', label: 'Birth date', type: 'birthday', hint: '1992-10-31, or 10-31 without a year' },
        { key: 'sex', label: 'Sex', type: 'choice', options: [{ value: 'female', label: 'Female' }, { value: 'male', label: 'Male' }, { value: 'other', label: 'Other' }] },
      ],
    },
    {
      kind: 'general', label: 'General', fields: [
        { key: 'what', label: 'What it is', type: 'text', hint: 'Bank, vendor, school, newsletter' },
        { key: 'website', label: 'Website', type: 'text', hint: 'example.com' },
      ],
    },
  ];
  static KIND_KEY = 'kind';
  static NOTE_KEY = 'note';
  static DETAIL_PREFIX = 'detail:';
  static MAX_FIELD = 120;
  static MAX_NOTES = 2000;
  static MAX_DETAILS = 20;
  static MAX_LABEL = 40;
  static MAX_VALUE = 200;
  static MAX_SUGGESTED = 12;
  static MAX_DISMISSED = 60;
  static ABOUT_CHARS = 280;

  static cleanKind(kind) {
    const wanted = String(kind || '').trim().toLowerCase();
    if (!ContactProfile.KINDS.some((k) => k.kind === wanted)) throw new Error(`A contact is a ${ContactProfile.KINDS.map((k) => k.kind).join(' or a ')} contact, not "${kind}".`);
    return wanted;
  }

  static read(stored) {
    const raw = stored && typeof stored === 'object' ? stored : {};
    return {
      fields: raw.fields && typeof raw.fields === 'object' ? { ...raw.fields } : {},
      details: Array.isArray(raw.details) ? raw.details.filter((d) => d && d.label && d.value) : [],
      notes: typeof raw.notes === 'string' ? raw.notes : '',
      suggested: Array.isArray(raw.suggested) ? raw.suggested.filter((s) => s && s.id && s.key) : [],
      dismissed: Array.isArray(raw.dismissed) ? raw.dismissed.map(String) : [],
    };
  }

  static isEmpty(profile) {
    const p = ContactProfile.read(profile);
    return !Object.values(p.fields).some(Boolean) && !p.details.length && !p.notes;
  }


  static apply(kind, current, patch = {}, { now = new Date() } = {}) {
    const profile = ContactProfile.read(current);
    const next = { ...profile, fields: ContactProfile._fieldsFor(kind, profile.fields) };
    for (const [key, value] of Object.entries(patch.fields || {})) next.fields = ContactProfile._withField(kind, next.fields, key, value, now);
    if (Array.isArray(patch.details)) next.details = ContactProfile._details([], patch.details);
    if (Array.isArray(patch.addDetails)) next.details = ContactProfile._details(next.details, patch.addDetails);
    if (patch.notes != null) next.notes = ContactProfile._text(patch.notes, ContactProfile.MAX_NOTES, { lines: true });
    if (patch.addNote) next.notes = ContactProfile._text([next.notes, ContactProfile._text(patch.addNote, ContactProfile.MAX_NOTES)].filter(Boolean).join('\n'), ContactProfile.MAX_NOTES, { lines: true });
    return next;
  }

  static merge(intoKind, into, fromKind, from) {
    const a = ContactProfile.read(into);
    const b = ContactProfile.read(from);
    const kind = intoKind !== fromKind && ContactProfile.isEmpty(a) ? fromKind : intoKind;
    const fields = {};
    for (const field of ContactProfile._kind(kind).fields) {
      const value = a.fields[field.key] || b.fields[field.key];
      if (value) fields[field.key] = value;
    }
    const labels = new Set(a.details.map((d) => d.label.toLowerCase()));
    return {
      kind,
      profile: {
        fields,
        details: [...a.details, ...b.details.filter((d) => !labels.has(d.label.toLowerCase()))].slice(0, ContactProfile.MAX_DETAILS),
        notes: [...new Set([a.notes, b.notes].filter(Boolean))].join('\n').slice(0, ContactProfile.MAX_NOTES),
        suggested: [...a.suggested, ...b.suggested.filter((s) => !a.suggested.some((mine) => ContactProfile._sameClaim(mine, s)))].slice(0, ContactProfile.MAX_SUGGESTED),
        dismissed: [...new Set([...a.dismissed, ...b.dismissed])].slice(-ContactProfile.MAX_DISMISSED),
      },
    };
  }


  static propose(kind, current, proposals, { now = new Date(), makeId }) {
    const profile = ContactProfile.read(current);
    const suggested = profile.suggested.slice();
    for (const proposal of Array.isArray(proposals) ? proposals : []) {
      const claim = ContactProfile._claim(proposal, now);
      if (!claim || ContactProfile._known(kind, profile, claim) || suggested.some((s) => ContactProfile._sameClaim(s, claim))) continue;
      if (profile.dismissed.includes(ContactProfile._claimKey(claim))) continue;
      suggested.push({ id: makeId(), ...claim, at: now.toISOString() });
    }
    return { ...profile, suggested: suggested.slice(0, ContactProfile.MAX_SUGGESTED) };
  }

  static accept(kind, current, suggestionId, { now = new Date() } = {}) {
    const profile = ContactProfile.read(current);
    const taken = profile.suggested.find((s) => s.id === suggestionId);
    if (!taken) throw new Error('That suggestion is no longer there.');
    const rest = { ...profile, suggested: profile.suggested.filter((s) => s.id !== suggestionId) };
    if (taken.key === ContactProfile.KIND_KEY) return { kind: ContactProfile.cleanKind(taken.value), profile: ContactProfile.apply(ContactProfile.cleanKind(taken.value), rest, {}, { now }) };
    const nextKind = ContactProfile._kindOfField(taken.key) || kind;
    return { kind: nextKind, profile: ContactProfile.apply(nextKind, rest, ContactProfile._patchFor(taken), { now }) };
  }

  static dismiss(current, suggestionId) {
    const profile = ContactProfile.read(current);
    const gone = profile.suggested.find((s) => s.id === suggestionId);
    if (!gone) throw new Error('That suggestion is no longer there.');
    return {
      ...profile,
      suggested: profile.suggested.filter((s) => s.id !== suggestionId),
      dismissed: [...new Set([...profile.dismissed, ContactProfile._claimKey(gone)])].slice(-ContactProfile.MAX_DISMISSED),
    };
  }


  static role(kind, current) {
    const fields = ContactProfile.read(current).fields;
    return String((kind === ContactProfile.PERSON ? fields.relation : fields.what) || '');
  }

  static about(kind, current, { now = new Date(), max = ContactProfile.ABOUT_CHARS } = {}) {
    const profile = ContactProfile.read(current);
    const parts = ContactProfile._kind(kind).fields.map((field) => ContactProfile._worded(field, profile.fields[field.key], now));
    for (const detail of profile.details) parts.push(`${detail.label}: ${detail.value}`);
    parts.push(profile.notes.replace(/\s*\n\s*/g, '; '));
    const text = parts.filter(Boolean).join('; ');
    return max && text.length > max ? `${text.slice(0, max - 3).trimEnd()}...` : text;
  }


  static _kind(kind) {
    return ContactProfile.KINDS.find((k) => k.kind === kind) || ContactProfile.KINDS.find((k) => k.kind === ContactProfile.GENERAL);
  }

  static _kindOfField(key) {
    const owner = ContactProfile.KINDS.find((k) => k.fields.some((f) => f.key === key));
    return owner ? owner.kind : null;
  }

  static _fieldsFor(kind, fields) {
    const kept = {};
    for (const field of ContactProfile._kind(kind).fields) {
      if (fields[field.key]) kept[field.key] = fields[field.key];
    }
    return kept;
  }

  static _withField(kind, fields, key, value, now) {
    const field = ContactProfile._kind(kind).fields.find((f) => f.key === key);
    if (!field) throw new Error(`"${key}" is not something a ${kind} contact has (${ContactProfile._kind(kind).fields.map((f) => f.key).join(', ')}).`);
    const clean = ContactProfile._fieldValue(field, value, now);
    const next = { ...fields };
    if (clean) next[key] = clean;
    else delete next[key];
    return next;
  }

  static _fieldValue(field, value, now) {
    const text = ContactProfile._text(value, ContactProfile.MAX_FIELD);
    if (!text) return '';
    if (field.type === 'birthday') return BirthDate.parse(text, { now });
    if (field.type !== 'choice') return text;
    const option = field.options.find((o) => o.value === text.toLowerCase() || o.label.toLowerCase() === text.toLowerCase());
    if (!option) throw new Error(`${field.label} is one of ${field.options.map((o) => o.value).join(', ')}, not "${text}".`);
    return option.value;
  }

  static _details(list, entries) {
    const next = list.slice();
    for (const entry of entries) {
      const label = ContactProfile._text(entry && entry.label, ContactProfile.MAX_LABEL);
      const value = ContactProfile._text(entry && entry.value, ContactProfile.MAX_VALUE);
      if (!label) continue;
      const at = next.findIndex((d) => d.label.toLowerCase() === label.toLowerCase());
      if (!value) { if (at >= 0) next.splice(at, 1); continue; }
      if (at >= 0) next[at] = { label, value };
      else next.push({ label, value });
    }
    if (next.length > ContactProfile.MAX_DETAILS) throw new Error(`A contact holds at most ${ContactProfile.MAX_DETAILS} further details.`);
    return next;
  }

  static _claim(proposal, now) {
    const key = String((proposal && proposal.key) || '').trim();
    const why = ContactProfile._text(proposal && proposal.why, ContactProfile.MAX_VALUE);
    try {
      if (key === ContactProfile.KIND_KEY) return { key, label: 'Kind', value: ContactProfile.cleanKind(proposal.value), why };
      if (key === ContactProfile.NOTE_KEY) return ContactProfile._valued({ key, label: 'Note', value: ContactProfile._text(proposal.value, ContactProfile.MAX_VALUE), why });
      if (key.toLowerCase().startsWith(ContactProfile.DETAIL_PREFIX)) {
        const label = ContactProfile._text(key.slice(ContactProfile.DETAIL_PREFIX.length), ContactProfile.MAX_LABEL);
        return label ? ContactProfile._valued({ key: `${ContactProfile.DETAIL_PREFIX}${label}`, label, value: ContactProfile._text(proposal.value, ContactProfile.MAX_VALUE), why }) : null;
      }
      const owner = ContactProfile._kindOfField(key);
      if (!owner) return null;
      const field = ContactProfile._kind(owner).fields.find((f) => f.key === key);
      return ContactProfile._valued({ key, label: field.label, value: ContactProfile._fieldValue(field, proposal.value, now), why });
    } catch (_) {
      return null;
    }
  }

  static _valued(claim) {
    return claim.value ? claim : null;
  }

  static _known(kind, profile, claim) {
    const same = (a, b) => String(a || '').toLowerCase() === String(b || '').toLowerCase();
    if (claim.key === ContactProfile.KIND_KEY) return claim.value === kind;
    if (claim.key === ContactProfile.NOTE_KEY) return profile.notes.toLowerCase().includes(claim.value.toLowerCase());
    if (claim.key.startsWith(ContactProfile.DETAIL_PREFIX)) return profile.details.some((d) => same(d.label, claim.label) && same(d.value, claim.value));
    return same(profile.fields[claim.key], claim.value);
  }

  static _sameClaim(a, b) {
    return ContactProfile._claimKey(a) === ContactProfile._claimKey(b);
  }

  static _claimKey(claim) {
    return `${String(claim.key).toLowerCase()}=${String(claim.value).toLowerCase()}`;
  }

  static _patchFor(suggestion) {
    if (suggestion.key === ContactProfile.NOTE_KEY) return { addNote: suggestion.value };
    if (suggestion.key.startsWith(ContactProfile.DETAIL_PREFIX)) return { addDetails: [{ label: suggestion.label, value: suggestion.value }] };
    return { fields: { [suggestion.key]: suggestion.value } };
  }

  static _worded(field, value, now) {
    if (!value) return '';
    return field.type === 'birthday' ? BirthDate.describe(value, { now }) : String(value);
  }

  static _text(value, max, { lines = false } = {}) {
    const raw = String(value == null ? '' : value);
    const tidy = lines ? raw.split(/\r?\n/).map((line) => line.replace(/\s+/g, ' ').trim()).filter(Boolean).join('\n') : raw.replace(/\s+/g, ' ').trim();
    return tidy.slice(0, max);
  }
}

module.exports = ContactProfile;
