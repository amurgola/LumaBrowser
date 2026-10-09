class ThinkingVocabulary {
  static PROBE_VERSION = 1;

  static EFFORT_ORDER = ['none', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max'];

  static ENABLED_EFFORTS = ThinkingVocabulary.EFFORT_ORDER.filter((e) => e !== 'none');

  static EFFORT_SPELLINGS = {
    none: ['none', 'off', 'no_think', 'disabled'],
    minimal: ['minimal'],
    low: ['low'],
    medium: ['medium'],
    high: ['high'],
    xhigh: ['xhigh', 'extra_high', 'extra-high', 'very_high', 'extra high'],
    max: ['max'],
  };

  static PASSTHROUGH_DOMAIN = ['low', 'medium', 'high'];

  static THINK_OPEN_MARKERS = [
    '<think>', '<thinking>', '<|think|>', '<reasoning>', '<|channel|>analysis',
    '[THINK]', '<|begin_of_thought|>', '<|inner_monologue|>', '<|think_start|>',
  ];

  static SHAPES = ['user', 'system', 'history', 'tools'];
}

module.exports = ThinkingVocabulary;
