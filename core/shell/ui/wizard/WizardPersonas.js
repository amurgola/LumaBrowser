export default class WizardPersonas {
  static DEFAULT = 'chat';

  static PERSONAS = [
    {
      id: 'chat',
      title: 'Chat privately',
      desc: 'ChatGPT at home, private, no subscription. One download, one click, a chat box.',
    },
    {
      id: 'create',
      title: 'Create images, stories and games',
      desc: 'Make images, characters, stories, voices, songs and small games on your own machine.',
    },
    {
      id: 'build',
      title: 'Build agents and automations',
      desc: 'An agent that can use a real browser, a REST API, an MCP server, Docker, sub-agents and tools you write yourself.',
    },
    {
      id: 'tune',
      title: 'Tune every knob',
      desc: 'Two GPUs and 128 GB of RAM? Pick runtimes, quants, placement and context yourself.',
    },
    {
      id: 'switch',
      title: 'I already run local AI',
      desc: 'LM Studio, Ollama or ComfyUI user. Keep your models, see every flag.',
    },
  ];

  static SETUP_LANDING = new Set(['tune', 'switch']);

  static normalize(id) {
    return WizardPersonas.PERSONAS.some((p) => p.id === id) ? id : WizardPersonas.DEFAULT;
  }

  static find(id) {
    return WizardPersonas.PERSONAS.find((p) => p.id === id) || null;
  }

  static isPlain(id) {
    return id === 'chat' || id === 'create';
  }
}
