class ChatterboxModels {
  static HF_BASE = 'https://huggingface.co/audio-cpp/audio.cpp-gguf/resolve/main';

  static MODELS = [
    {
      id: 'chatterbox',
      family: 'chatterbox',
      task: 'clone',
      name: 'Chatterbox (0.5B, voice cloning)',
      description: 'Clones any voice from a 5-20 second clip. 18 languages. Expressive, with [laugh]-style tags.',
      file: 'chatterbox-q8_0.gguf',
      url: `${ChatterboxModels.HF_BASE}/Chatterbox-GGUF/chatterbox-q8_0.gguf`,
      sizeBytes: 2088393668,
      license: 'MIT (Resemble AI)',
      languages: ['en', 'ar', 'da', 'de', 'el', 'es', 'fi', 'fr', 'hi', 'it', 'ko', 'ms', 'nl', 'no', 'pl', 'pt', 'sv', 'sw', 'tr'],
    },
    {
      id: 'chatterbox-turbo',
      family: 'chatterbox_turbo',
      task: 'tts',
      name: 'Chatterbox Turbo (350M, built-in voice)',
      description: 'Fast English voice with a fixed speaker. No cloning; a good default while a GPU is busy.',
      file: 'chatterbox-turbo-q8_0.gguf',
      url: `${ChatterboxModels.HF_BASE}/Chatterbox-Turbo-GGUF/chatterbox-turbo-q8_0.gguf`,
      sizeBytes: 699101408,
      license: 'MIT (Resemble AI)',
      languages: ['en'],
    },
  ];

  static LANGUAGE_NAMES = {
    en: 'English', ar: 'Arabic', da: 'Danish', de: 'German', el: 'Greek', es: 'Spanish', fi: 'Finnish',
    fr: 'French', hi: 'Hindi', it: 'Italian', ko: 'Korean', ms: 'Malay', nl: 'Dutch', no: 'Norwegian',
    pl: 'Polish', pt: 'Portuguese', sv: 'Swedish', sw: 'Swahili', tr: 'Turkish',
  };

  static getModels() {
    return ChatterboxModels.MODELS;
  }

  static getModelById(id) {
    return ChatterboxModels.MODELS.find((m) => m.id === id) || null;
  }
}

module.exports = ChatterboxModels;
