const CharacterProfile = require('../world/CharacterProfile');
const ProfilePrompt = require('../prompts/ProfilePrompt');
const RpDebug = require('../images/RpDebug');

class ProfileCall {
  static TIMEOUT_MS = 60000;
  static TEMPERATURE = 0.4;
  static PER_TURN_MAX = 2;

  constructor(chat, logger = null) {
    this._chat = chat;
    this._logger = logger;
  }

  static candidates(data, present, newCharIds) {
    const wanted = new Set(newCharIds || []);
    const list = [];
    for (const c of Array.isArray(data.characters) ? data.characters : []) {
      if (!c || !c.name) continue;
      const inScene = wanted.has(c.id) || present.some((p) => p && p.id === c.id);
      if (inScene && CharacterProfile.isBlank(c)) list.push(c);
    }
    return list.slice(0, ProfileCall.PER_TURN_MAX);
  }

  static request(data, char, content) {
    return {
      messages: ProfilePrompt.messages(data, char, content), temperature: ProfileCall.TEMPERATURE,
      timeoutMs: ProfileCall.TIMEOUT_MS, noThink: true, modelRef: data.llmModel || undefined,
    };
  }

  async run(data, chars, content) {
    if (typeof this._chat.complete !== 'function') return false;
    let changed = false;
    for (const char of chars) {
      if (await this._profile(data, char, content)) changed = true;
    }
    return changed;
  }

  async _profile(data, char, content) {
    const started = Date.now();
    try {
      const r = await this._chat.complete(ProfileCall.request(data, char, content));
      const patch = r && r.text ? ProfilePrompt.parse(r.text) : null;
      RpDebug.log('post.profile', { ms: Date.now() - started, name: char.name, ok: !!patch, error: r && r.error });
      return patch ? CharacterProfile.apply(char, patch) : false;
    } catch (e) {
      RpDebug.log('post.profile.error', { ms: Date.now() - started, name: char.name, error: e && e.message });
      if (this._logger && this._logger.warn) this._logger.warn('roleplay profile call failed', { error: e && e.message });
      return false;
    }
  }
}

module.exports = ProfileCall;
