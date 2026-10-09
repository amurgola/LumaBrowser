const UserToolStore = require('./UserToolStore');

class ToolDraftInput {
  static MIN_DESCRIPTION = 8;

  constructor({ validator, names }) {
    this._validator = validator;
    this._names = names;
  }

  async check(input = {}) {
    const name = String(input.name || '').trim();
    const shapeError = this._shapeError(name, input);
    if (shapeError) return { error: { success: false, error: shapeError } };
    const codeError = await this._codeError(String(input.code || ''));
    if (codeError) return { error: codeError };
    return { fields: ToolDraftInput._fields(name, input) };
  }

  _shapeError(name, input) {
    if (!UserToolStore.isValidName(name)) {
      return `Invalid tool name "${name}". Use 3-41 characters: a lowercase letter followed by lowercase letters, digits, or underscores (e.g. github_stars).`;
    }
    if (this._names.collides(name)) return `The name "${name}" is already used by another tool. Pick a different name.`;
    if (!input.description || String(input.description).trim().length < ToolDraftInput.MIN_DESCRIPTION) {
      return 'Provide a clear description (this is what the AI reads to decide when to use the tool).';
    }
    const schema = ToolDraftInput._schema(input.inputSchema);
    if (schema.type && schema.type !== 'object') return 'inputSchema.type must be "object" (tools take a named-argument object).';
    if (!String(input.code || '').trim()) return 'Provide the tool code (an async function run(args, ctx)).';
    return null;
  }

  async _codeError(code) {
    const validation = await this._validate(code);
    if (validation && validation.ok === false) {
      return {
        success: false,
        error: 'The code has syntax errors. Fix them and call create_tool again.',
        diagnostics: (validation.diagnostics || []).slice(0, 10),
      };
    }
    if (!/\brun\b/.test(code)) return { success: false, error: 'Your code must declare an async function named run(args, ctx).' };
    return null;
  }

  async _validate(code) {
    try {
      return await this._validator.validate({ language: 'javascript', content: code });
    } catch (_) {
      return { ok: true, diagnostics: [] };
    }
  }

  static _fields(name, input) {
    return {
      name,
      label: input.label,
      description: String(input.description).trim(),
      inputSchema: ToolDraftInput._schema(input.inputSchema),
      configSlots: ToolDraftInput.normalizeSlots(input.configSlots),
      allowedHosts: Array.isArray(input.allowedHosts) ? input.allowedHosts.map((host) => String(host)).filter(Boolean) : [],
      code: String(input.code || ''),
    };
  }

  static _schema(schema) {
    return schema && typeof schema === 'object' ? schema : { type: 'object', properties: {} };
  }

  static normalizeSlots(slots) {
    if (!Array.isArray(slots)) return [];
    return slots
      .filter((slot) => slot && slot.key)
      .map((slot) => ({
        key: String(slot.key),
        label: String(slot.label || slot.key),
        description: String(slot.description || ''),
        required: !!slot.required,
        secret: !!slot.secret,
      }));
  }
}

module.exports = ToolDraftInput;
