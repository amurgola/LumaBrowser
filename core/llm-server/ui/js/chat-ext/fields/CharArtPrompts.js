export default class CharArtPrompts {
  static CONTEXT_CHARS = 160;

  constructor(field, siblingModel, rootModel) {
    this._field = field;
    this._sibling = siblingModel;
    this._root = rootModel;
  }

  subject() {
    const key = this._field.genFromKey;
    return key && this._sibling && this._sibling[key] ? String(this._sibling[key]) : '';
  }

  baseModelRef() {
    return this._fromRoot(this._field.modelFromKey) || undefined;
  }

  editModelRef() {
    return this._fromRoot(this._field.refModelFromKey);
  }

  compose(extra, opts) {
    const withContext = !opts || opts.context !== false;
    const withSubject = !opts || opts.subject !== false;
    const subject = opts && opts.subjectText != null ? opts.subjectText : this.subject();
    return [this._field.basePrefix || '', this._fromRoot(this._field.styleFromKey), withContext ? this._context() : '',
      withSubject ? subject : '', extra || '']
      .map((p) => String(p || '').trim()).filter(Boolean).join(', ');
  }

  static customEmotion(name) {
    const emotion = String(name || 'this emotion').trim();
    const closedEyes = /\b(eyes?\s*closed|closed\s*eyes?|sleepy|asleep|wink|winking)\b/.test(emotion.toLowerCase())
      ? 'If the requested expression includes closed eyes or a wink, fully change the eyelids as requested; do not keep both eyes open. '
      : '';
    return 'Image 1 is the base portrait and defines the hairstyle, hair color, face shape, and identity. '
      + 'Preserve identity, but allow the facial expression to change naturally: eyes, eyelids, eyebrows, cheeks, and mouth may move. '
      + closedEyes
      + 'Make the expression: ' + emotion + '. If eyes are visible, keep the same eye color. Head and shoulders, solo, plain background.';
  }

  static outfit(item) {
    return 'Image 1 is the full-body character reference. Create the exact same character with the same face, hairstyle, hair color, eye color, natural body proportions, normal head size, and realistic head-to-body ratio. Change only the clothing to: '
      + (item.desc || item.name || 'the described outfit')
      + '. Standing upright, show from head to shoes, crop close so the body fills most of the frame. No chibi, no big head, no tiny body, no childlike proportions. Centered, solo, clean plain background.';
  }

  _context() {
    const value = this._fromRoot(this._field.contextFromKey);
    return value ? value.slice(0, CharArtPrompts.CONTEXT_CHARS) : '';
  }

  _fromRoot(key) {
    return key && this._root && this._root[key] ? String(this._root[key]) : '';
  }
}
