export default class PersonaSeeds {
  static SEEDS = {
    chat: [
      ['Summarise a document', '', 'Summarise the attached document in five bullet points.', 'Attach a file and get the short version.'],
      ['Explain something simply', '', 'Explain this in plain language, as if I am new to it: ', 'Plain answers without the jargon.'],
      ['How good is this model?', '', 'In a few sentences: which model are you, roughly how fast are you running on this machine, and what are you good at and weaker at?', 'Its speed on this machine, strengths and limits.'],
    ],
    create: [
      ['Make an image', '', 'Make an image of ', 'Describe it and it renders on this machine.'],
      ['Start a roleplay', '', 'Start a roleplay: ', 'Set the characters and the scene.'],
      ['Build a game', '', 'Build a small browser game: ', 'A small game that runs right in the chat.'],
    ],
    build: [
      ['Show my MCP config', '', 'Show me the MCP client configuration for connecting an AI assistant to this browser.', 'Connect another assistant to this browser.'],
      ['Call the REST API', '', 'Show me a curl example that opens a tab and reads its HTML through the REST API.', 'A curl example that opens and reads a tab.'],
      ['Open Code mode', '', 'Open Code mode for a project folder.', 'Work on a project folder with the agent.'],
    ],
    tune: [
      ['Run the compatibility gambit', '', 'Run the model compatibility gambit on the current model and summarise the result.', 'Test what the current model handles well.'],
      ['Explain my placement', '', 'Explain how the current model is placed across my GPUs and what I could change.', 'How the model is split across your GPUs.'],
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
}
