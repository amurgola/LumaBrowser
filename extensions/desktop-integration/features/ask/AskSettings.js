class AskSettings {
  static DEFAULT_PROMPT = 'Help me with what is in this window.';
  static MIN_TEXT_CHARS = 500;
  static MAX_TEXT_CHARS = 200000;

  static SCHEMA = [
    {
      key: 'defaultPrompt',
      label: 'Default prompt',
      type: 'textarea',
      default: AskSettings.DEFAULT_PROMPT,
      help: 'Put in the chat composer when the client sends no prompt of its own.',
    },
    {
      key: 'defaultMode',
      label: 'What to capture',
      type: 'select',
      options: [
        { value: 'both', label: 'Text and screenshot' },
        { value: 'text', label: 'Text only' },
        { value: 'screenshot', label: 'Screenshot only' },
      ],
      default: 'both',
      help: 'Used when the client does not choose. Text is read through UI Automation; some apps expose little of it.',
    },
    {
      key: 'autoSend',
      label: 'Send right away',
      type: 'bool',
      default: false,
      help: 'Send the question as soon as the chat opens, instead of leaving it in the composer for you to edit.',
    },
    {
      key: 'maxTextChars',
      label: 'Text limit (characters)',
      type: 'number',
      default: 20000,
      min: AskSettings.MIN_TEXT_CHARS,
      max: AskSettings.MAX_TEXT_CHARS,
      step: 500,
      help: 'Window text beyond this is cut (500 to 200000).',
    },
    {
      key: 'hotkey',
      label: 'Hotkey: ask about the window in front',
      type: 'hotkey',
      default: '',
      help: 'A global shortcut such as Ctrl+Alt+A that asks about whatever window is in front. Empty for none.',
    },
    {
      key: 'notifyOnError',
      label: 'Notify when a window cannot be read',
      type: 'bool',
      default: true,
      help: 'Show a Windows notification when Luma refuses or fails to read a window (elevated apps, minimized windows).',
    },
  ];

  constructor(store) {
    this._store = store;
  }

  static defaultOf(key) {
    const field = AskSettings.SCHEMA.find((f) => f.key === key);
    return field ? field.default : undefined;
  }

  get(key) {
    const fallback = AskSettings.defaultOf(key);
    let value;
    try {
      value = this._store ? this._store.get(key, fallback) : fallback;
    } catch (_) {
      value = fallback;
    }
    return AskSettings.normalize(key, value);
  }

  all() {
    const out = {};
    for (const field of AskSettings.SCHEMA) out[field.key] = this.get(field.key);
    return out;
  }

  static normalize(key, value) {
    const fallback = AskSettings.defaultOf(key);
    switch (key) {
      case 'defaultPrompt': {
        const s = typeof value === 'string' ? value.trim() : '';
        return s || fallback;
      }
      case 'defaultMode':
        return ['both', 'text', 'screenshot'].includes(value) ? value : fallback;
      case 'autoSend':
      case 'notifyOnError':
        return typeof value === 'boolean' ? value : value === 'true' ? true : value === 'false' ? false : fallback;
      case 'maxTextChars': {
        const n = Math.trunc(Number(value));
        if (!Number.isFinite(n)) return fallback;
        return Math.min(AskSettings.MAX_TEXT_CHARS, Math.max(AskSettings.MIN_TEXT_CHARS, n));
      }
      case 'hotkey':
        return typeof value === 'string' ? value.trim() : '';
      default:
        return value;
    }
  }
}

module.exports = AskSettings;
