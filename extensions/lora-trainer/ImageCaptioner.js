class ImageCaptioner {
  static TIMEOUT_MS = 60000;
  static CAPTION_MAX = 600;
  static TAGS = 'tags';

  static SYSTEM = 'You write training captions for an image model. Reply with the caption only: no preface, no quotes, no notes.';

  static TAGS_PROMPT = 'Caption this picture as 12 to 25 short lowercase tags separated by commas. '
    + 'Tag what changes from picture to picture: pose, expression, clothing, objects, setting, lighting, framing, art style. '
    + 'Do NOT tag the permanent look of the main subject (face, hair colour, eye colour, body shape, species).';

  static SENTENCE_PROMPT = 'Caption this picture in one or two plain sentences. '
    + 'Describe what changes from picture to picture: pose, expression, clothing, objects, setting, lighting, framing, art style. '
    + 'Do NOT describe the permanent look of the main subject (face, hair colour, eye colour, body shape, species).';

  static LOCAL_PREFIX = 'local::';

  constructor({ chat, localModelRef = () => null, timeoutMs = ImageCaptioner.TIMEOUT_MS }) {
    this._chat = chat;
    this._localModelRef = localModelRef;
    this._timeoutMs = timeoutMs;
  }

  captionModelRef() {
    try {
      const ref = this._localModelRef();
      return typeof ref === 'string' && ref.startsWith(ImageCaptioner.LOCAL_PREFIX) ? ref : null;
    } catch (_) {
      return null;
    }
  }

  visionAvailable() {
    const modelRef = this.captionModelRef();
    try {
      return !!(modelRef && this._chat && typeof this._chat.visionAvailable === 'function' && this._chat.visionAvailable(modelRef));
    } catch (_) {
      return false;
    }
  }

  async caption({ bytes, ext, style, trigger, subject }) {
    const description = await this._describe({ bytes, ext, style, subject });
    return description
      ? { caption: ImageCaptioner.withTrigger(trigger, description), described: true }
      : { caption: ImageCaptioner.fallback(trigger, subject), described: false };
  }

  async _describe({ bytes, ext, style, subject }) {
    if (!this.visionAvailable() || typeof this._chat.complete !== 'function') return null;
    try {
      const reply = await this._chat.complete({
        modelRef: this.captionModelRef(),
        messages: ImageCaptioner.messages(style, subject),
        images: [{ kind: 'image', base64: bytes.toString('base64'), mime: ext === 'png' ? 'image/png' : 'image/jpeg' }],
        temperature: 0.2,
        timeoutMs: this._timeoutMs,
        noThink: true,
      });
      return reply && reply.text ? ImageCaptioner.clean(reply.text) : null;
    } catch (_) {
      return null;
    }
  }

  static messages(style, subject) {
    const base = style === ImageCaptioner.TAGS ? ImageCaptioner.TAGS_PROMPT : ImageCaptioner.SENTENCE_PROMPT;
    const about = subject ? ` The main subject is: ${subject}.` : '';
    return [{ role: 'system', content: ImageCaptioner.SYSTEM }, { role: 'user', content: base + about }];
  }

  static clean(text) {
    return String(text)
      .replace(/```[a-z]*|```/gi, ' ')
      .replace(/^\s*(?:caption|tags)\s*:\s*/i, '')
      .replace(/\s+/g, ' ')
      .replace(/^["'\s]+|["'\s]+$/g, '')
      .slice(0, ImageCaptioner.CAPTION_MAX)
      .trim();
  }

  static withTrigger(trigger, description) {
    return `${trigger}, ${description}`;
  }

  static fallback(trigger, subject) {
    return subject ? `${trigger}, ${subject}` : trigger;
  }
}

module.exports = ImageCaptioner;
