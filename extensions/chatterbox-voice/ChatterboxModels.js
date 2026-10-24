class ChatterboxModels {
  static HF_BASE = 'https://huggingface.co/audio-cpp/audio.cpp-gguf/resolve/main';

  static KITTEN_ID = 'kitten-tts2';
  static KITTEN_DEFAULT_PRESET = 'Bruno';

  static CLONE_PREFERENCE = ['chatterbox', 'kitten-tts2'];

  static KITTEN_VOICE_GROUPS = [
    {
      name: 'English voices',
      voices: ['Bella', 'Jasper', 'Luna', 'Bruno', 'Rosie', 'Hugo', 'Kiki', 'Leo', 'Matthew', 'Elliot', 'Willow', 'Dolores',
        'Victor', 'Dante', 'Alfred', 'Saoirse', 'Claire', 'Raven', 'Marcus', 'Herbert', 'Diana', 'Laurence', 'Maeve', 'Walter',
        'Edith', 'Miles', 'Grace', 'Reginald', 'Iris', 'Frank', 'Serena', 'Julian', 'Eleanor', 'Otis', 'Vincent', 'Martha',
        'Sable', 'Victoria'],
    },
    {
      name: 'Language voices',
      voices: ['Arabic', 'Chinese', 'French', 'German', 'Hindi', 'Italian', 'Portuguese', 'Russian', 'Spanish'],
    },
    {
      name: 'Character and scene voices',
      voices: ['AirportAnnouncer', 'ArabicChildSchool', 'ArabicFalconer', 'ArabicMother', 'ArabicNews', 'AudiobookNarratorFemale',
        'BoredTeenager', 'CalmHostageNegotiator', 'ChineseKidSpringFestival', 'ChineseLivestreamSeller', 'ChineseNewsCctv',
        'ChineseXianxiaMaster', 'DutchBaker', 'DutchGrandpaStory', 'DutchWeatherPresenter', 'FairytaleNarratorWhimsical',
        'FrenchDocumentary', 'FrenchGrandmereRecette', 'FrenchTeacher', 'FrenchWaiter', 'GermanKidBirthday', 'GermanKneipe',
        'GermanProfessor', 'GermanTrainAnnouncement', 'GrandmaBedtimeStory', 'GriefEulogy', 'HindiBollywoodDrama',
        'HindiCollegeFriends', 'HindiDadiKahani', 'HindiYogaTeacher', 'IndonesianNewsAnchor', 'IndonesianTourGuide',
        'ItalianChildSchool', 'ItalianFashionDesigner', 'ItalianFootballFan', 'ItalianGondolier', 'ItalianNonnaKitchen',
        'ItalianOperaTenor', 'JapaneseAnimeHeroine', 'JapaneseGrandma', 'JapaneseSalarymanApology', 'JapaneseTrainConductor',
        'KoreanGrandpaAdvice', 'KoreanKdramaConfession', 'KoreanNewsAnchor', 'LittleGirlExplaining', 'NervousFirstDate',
        'NewsAnchorFemale', 'PilotCabinAnnouncement', 'PolishBabciaPierogi', 'PolishMountainGuide', 'PolishNewsAnchor',
        'PolishPoetryStudent', 'PortugueseBeach', 'PortugueseBusiness', 'PortugueseFado', 'PortugueseGrandpaFarm',
        'PortugueseKidFutebol', 'PortugueseNewsAnchor', 'RussianBabushka', 'RussianFairyTale', 'RussianHockeyCheer',
        'RussianLiteratureTeacher', 'RussianSpaceControl', 'RussianTaxiDriver', 'SarcasticCoworker', 'SchoolboyPresentation',
        'SpanishAbuela', 'SpanishBreakupSad', 'SpanishChildCuento', 'SpanishNews', 'SpanishTango', 'TurkishFisherman',
        'TurkishGrandmaCooking', 'TurkishNewsAnchor', 'WeatherPresenterCheerful'],
    },
  ];

  static KITTEN_PRESETS = ChatterboxModels.KITTEN_VOICE_GROUPS.flatMap((group) => group.voices);

  static MODELS = [
    {
      id: 'chatterbox',
      family: 'chatterbox',
      tasks: ['clone'],
      serverTask: 'clon',
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
      tasks: ['tts'],
      serverTask: 'tts',
      name: 'Chatterbox Turbo (350M, built-in voice)',
      description: 'Fast English voice with a fixed speaker. No cloning; a good default while a GPU is busy.',
      file: 'chatterbox-turbo-q8_0.gguf',
      url: `${ChatterboxModels.HF_BASE}/Chatterbox-Turbo-GGUF/chatterbox-turbo-q8_0.gguf`,
      sizeBytes: 699101408,
      license: 'MIT (Resemble AI)',
      languages: ['en'],
    },
    {
      id: ChatterboxModels.KITTEN_ID,
      family: 'kitten_tts2',
      tasks: ['tts', 'clone'],
      serverTask: 'tts',
      acceptsSpeed: false,
      name: 'KittenTTS 2 (1.7B, Q8, built-in voices and cloning)',
      description: 'Natural speech with 123 built-in voices in 16 languages, and zero-shot cloning from a 5-30 second clip plus its transcript. '
        + 'Ternary weights: real time on a GPU, slower than real time on a CPU (about 4.8 GB of RAM). Speed control is not supported.',
      file: 'kitten-tts2-20261021-q8_0.gguf',
      url: `${ChatterboxModels.HF_BASE}/KittenTTS2-GGUF/kitten-tts2-20261021-q8_0.gguf`,
      sizeBytes: 3343404128,
      license: 'Stellon Labs Community License (KittenML)',
      licenseNote: 'Commercial terms: free for personal use and for organizations under 1 million USD in annual revenue and total funding. '
        + 'Commercial use requires registering with Stellon Labs (free), keeping their license notice, and showing "Powered by KittenML" in the product. '
        + 'The model and its output may not be used to train other models.',
      attribution: 'Powered by KittenML',
      languages: ['en', 'ar', 'zh', 'fr', 'de', 'hi', 'it', 'pt', 'ru', 'es', 'nl', 'id', 'ja', 'ko', 'pl', 'tr'],
      presets: ChatterboxModels.KITTEN_PRESETS,
      defaultPreset: ChatterboxModels.KITTEN_DEFAULT_PRESET,
      minRuntimePublishedAt: '2026-10-19T00:00:00Z',
    },
  ];

  static LANGUAGE_NAMES = {
    en: 'English', ar: 'Arabic', da: 'Danish', de: 'German', el: 'Greek', es: 'Spanish', fi: 'Finnish',
    fr: 'French', hi: 'Hindi', id: 'Indonesian', it: 'Italian', ja: 'Japanese', ko: 'Korean', ms: 'Malay',
    nl: 'Dutch', no: 'Norwegian', pl: 'Polish', pt: 'Portuguese', ru: 'Russian', sv: 'Swedish', sw: 'Swahili',
    tr: 'Turkish', zh: 'Chinese',
  };

  static getModels() {
    return ChatterboxModels.MODELS;
  }

  static getModelById(id) {
    return ChatterboxModels.MODELS.find((m) => m.id === id) || null;
  }

  static canClone(m) {
    return !!m && m.tasks.includes('clone');
  }

  static hasPresets(m) {
    return !!m && Array.isArray(m.presets) && m.presets.length > 0;
  }

  static acceptsSpeed(id) {
    const m = ChatterboxModels.getModelById(id);
    return !m || m.acceptsSpeed !== false;
  }

  static runtimeSupports(m, release) {
    if (!m || !m.minRuntimePublishedAt) return true;
    if (!release || !release.publishedAt) return true;
    return String(release.publishedAt) >= m.minRuntimePublishedAt;
  }

  static runtimeNote(m) {
    return `Needs the audio.cpp release of ${m.minRuntimePublishedAt.slice(0, 10)} or newer: reinstall the engine above.`;
  }

  static presetFor(m, stored) {
    if (!ChatterboxModels.hasPresets(m)) return null;
    return stored && m.presets.includes(String(stored)) ? String(stored) : m.defaultPreset;
  }
}

module.exports = ChatterboxModels;
