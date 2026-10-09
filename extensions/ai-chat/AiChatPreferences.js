class AiChatPreferences {
  static SYSTEM_PROMPT_KEY = 'aiChat.systemPrompt';

  constructor(rawDb) {
    this._rawDb = rawDb;
  }

  get() {
    return {
      systemPrompt: this._rawDb.get(AiChatPreferences.SYSTEM_PROMPT_KEY, ''),
    };
  }

  save(preferences) {
    try {
      if (preferences && typeof preferences.systemPrompt === 'string') {
        this._rawDb.set(AiChatPreferences.SYSTEM_PROMPT_KEY, preferences.systemPrompt);
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = AiChatPreferences;
