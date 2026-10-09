export default class PersonaSeeds {
  static SEEDS = {
    chat: [
      ['Ask me anything', '', 'Ask me anything: '],
      ['Summarise a document', '', 'Summarise the attached document in five bullet points.'],
      ['How good is this model?', '', 'In a few sentences: which model are you, roughly how fast are you running on this machine, and what are you good at and weaker at?'],
    ],
    create: [
      ['Make an image', '', 'Make an image of '],
      ['Start a roleplay', '', 'Start a roleplay: '],
      ['Build a game', '', 'Build a small browser game: '],
    ],
    build: [
      ['Show my MCP config', '', 'Show me the MCP client configuration for connecting an AI assistant to this browser.'],
      ['Call the REST API', '', 'Show me a curl example that opens a tab and reads its HTML through the REST API.'],
      ['Open Code mode', '', 'Open Code mode for a project folder.'],
    ],
    tune: [
      ['Run the compatibility gambit', '', 'Run the model compatibility gambit on the current model and summarise the result.'],
      ['Explain my placement', '', 'Explain how the current model is placed across my GPUs and what I could change.'],
    ],
  };

  static forPersona(persona) {
    return PersonaSeeds.SEEDS[String(persona || 'chat')] || PersonaSeeds.SEEDS.chat;
  }

  static resolve(personaSeeds) {
    const override = typeof window !== 'undefined' ? window.LumaLandingSeeds : null;
    if (Array.isArray(override) && override.length) return override;
    return Array.isArray(personaSeeds) ? personaSeeds : [];
  }

  static greeting(date) {
    const h = (date || new Date()).getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  }
}
