const HtmlToMarkdown = require('../../shared/content/HtmlToMarkdown');
const ResponseText = require('../../llm-service/ResponseText');
const CivitaiSamplerMap = require('./CivitaiSamplerMap');

class CivitaiDescriptionReader {
  static SLOT_ID = 'image-server.civitai-reader';

  static SLOT_LABEL = 'CivitAI model page reader (reads a checkpoint\'s description for its recommended settings)';

  static MAX_CHARS = 9000;

  static MIN_CHARS = 40;

  static TIMEOUT_MS = 120000;

  static KEYS = Object.freeze(['steps', 'cfgScale', 'sampler', 'scheduler', 'width', 'height', 'clipSkip', 'negativePrompt', 'positivePrefix', 'triggerWords', 'notes', 'confidence']);

  static SYSTEM = [
    'You extract the creator\'s recommended generation settings from the description of a Stable Diffusion checkpoint.',
    'Answer with ONE JSON object and nothing else. Keys:',
    '  steps (integer), cfgScale (number), sampler (string exactly as written), scheduler (string exactly as written, e.g. "Karras"),',
    '  width (integer), height (integer), clipSkip (integer), negativePrompt (string), positivePrefix (string: quality tags or words the creator says to put at the start of every prompt),',
    '  triggerWords (array of strings), notes (one sentence, at most 200 characters, with any other advice that changes results), confidence (0 to 1).',
    'Rules: use null for anything the description does not state; never invent values. When a range is given, answer its middle.',
    'When several variants are described, prefer the settings for the version named by the user.',
    'Ignore settings for other models the creator advertises, LoRA weights, and upscaler or hires-fix passes.',
  ].join('\n');

  constructor({ llm, slotId = CivitaiDescriptionReader.SLOT_ID, timeoutMs = CivitaiDescriptionReader.TIMEOUT_MS, convert = HtmlToMarkdown.convert } = {}) {
    this._llm = llm || null;
    this._slotId = slotId;
    this._timeoutMs = timeoutMs;
    this._convert = convert;
    this._registerSlot();
  }

  _registerSlot() {
    if (!this._llm || typeof this._llm.registerSlot !== 'function') return;
    try {
      this._llm.registerSlot(this._slotId, { extensionId: 'core', label: CivitaiDescriptionReader.SLOT_LABEL, required: false });
    } catch (_) {}
  }

  get available() {
    return !!(this._llm && typeof this._llm.sendCompletion === 'function');
  }

  async read({ model, version, map } = {}) {
    if (!this.available) return null;
    const text = this.text(model, version);
    if (text.length < CivitaiDescriptionReader.MIN_CHARS) return null;
    const messages = [
      { role: 'system', content: CivitaiDescriptionReader.SYSTEM },
      { role: 'user', content: CivitaiDescriptionReader.userPrompt({ model, version, map, text }) },
    ];
    let result;
    try {
      result = await this._llm.sendCompletion(this._slotId, messages, { temperature: 0, timeout: this._timeoutMs, label: 'CivitAI model notes' });
    } catch (err) {
      return null;
    }
    if (!result || !result.success) return null;
    const raw = ResponseText.extract(result.response) || '';
    const parsed = CivitaiDescriptionReader.parseJson(raw);
    if (!parsed) return null;
    const recipe = CivitaiDescriptionReader.validate(parsed);
    return recipe ? { recipe, raw, text } : null;
  }

  text(model, version) {
    const parts = [];
    const versionHtml = version && version.description;
    const modelHtml = model && model.description;
    if (versionHtml) parts.push(this._convert(String(versionHtml)));
    if (modelHtml) parts.push(this._convert(String(modelHtml)));
    const joined = parts.map((p) => String(p || '').trim()).filter(Boolean).join('\n\n');
    return joined.length > CivitaiDescriptionReader.MAX_CHARS ? `${joined.slice(0, CivitaiDescriptionReader.MAX_CHARS)}\n[truncated]` : joined;
  }

  static userPrompt({ model, version, map, text }) {
    const name = `${(model && model.name) || 'this checkpoint'}${version && version.name ? `, version "${version.name}"` : ''}`;
    const base = (version && version.baseModel) || (map && map.baseModel) || 'unknown';
    return `Checkpoint: ${name}\nBase model: ${base}\n\nDescription:\n${text}\n\nAnswer the JSON object now.`;
  }

  static parseJson(raw) {
    const text = String(raw || '').replace(/```(?:json)?/gi, '');
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start < 0 || end <= start) return null;
    const candidates = [text.slice(start, end + 1)];
    const firstClose = text.indexOf('}', start);
    if (firstClose > start && firstClose !== end) candidates.push(text.slice(start, firstClose + 1));
    for (const candidate of candidates) {
      try {
        const value = JSON.parse(candidate);
        if (value && typeof value === 'object' && !Array.isArray(value)) return value;
      } catch (_) {}
    }
    return null;
  }

  static validate(obj) {
    const out = {};
    const steps = CivitaiDescriptionReader._int(obj.steps, 1, 150);
    if (steps != null) out.steps = steps;
    const cfg = CivitaiDescriptionReader._num(obj.cfgScale, 0, 30);
    if (cfg != null) out.cfgScale = Math.round(cfg * 10) / 10;
    const samplerLabel = CivitaiDescriptionReader._str(obj.sampler, 60);
    const schedulerLabel = CivitaiDescriptionReader._str(obj.scheduler, 60);
    if (samplerLabel || schedulerLabel) {
      const resolved = CivitaiSamplerMap.resolve(samplerLabel, schedulerLabel || undefined);
      if (resolved && resolved.sampler) {
        out.sampler = resolved.sampler;
        if (resolved.scheduler) out.scheduler = resolved.scheduler;
        out.samplerSource = samplerLabel;
        out.samplerExact = resolved.exact;
      } else if (resolved && resolved.scheduler) {
        out.scheduler = resolved.scheduler;
      }
    }
    const width = CivitaiDescriptionReader._int(obj.width, 256, 4096);
    const height = CivitaiDescriptionReader._int(obj.height, 256, 4096);
    if (width != null && height != null) {
      out.width = width;
      out.height = height;
    }
    const clipSkip = CivitaiDescriptionReader._int(obj.clipSkip, 1, 12);
    if (clipSkip != null) out.clipSkip = clipSkip;
    const negative = CivitaiDescriptionReader._str(obj.negativePrompt, 2000);
    if (negative) out.negativePrompt = negative;
    const prefix = CivitaiDescriptionReader._str(obj.positivePrefix, 400);
    if (prefix) out.positivePrefix = prefix;
    const words = Array.isArray(obj.triggerWords) ? obj.triggerWords.map((w) => CivitaiDescriptionReader._str(w, 80)).filter(Boolean).slice(0, 20) : [];
    if (words.length) out.triggerWords = words;
    const notes = CivitaiDescriptionReader._str(obj.notes, 300);
    if (notes) out.notes = notes;
    const confidence = CivitaiDescriptionReader._num(obj.confidence, 0, 1);
    if (confidence != null) out.confidence = confidence;
    return Object.keys(out).some((k) => k !== 'confidence') ? out : null;
  }

  static _int(value, min, max) {
    const n = typeof value === 'string' ? Number(value.trim()) : value;
    return Number.isInteger(n) && n >= min && n <= max ? n : null;
  }

  static _num(value, min, max) {
    const n = typeof value === 'string' ? Number(value.trim()) : value;
    return Number.isFinite(n) && n >= min && n <= max ? n : null;
  }

  static _str(value, max) {
    if (typeof value !== 'string') return null;
    const text = value.replace(/\s+/g, ' ').trim();
    if (!text || /^(null|none|n\/a|unknown)$/i.test(text)) return null;
    return text.slice(0, max);
  }
}

module.exports = CivitaiDescriptionReader;
