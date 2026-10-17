class GameDelegate {
  static ID = 'game';

  static TARGETS = [
    {
      id: GameDelegate.ID,
      label: 'Game: build a playable game',
      description: 'Builds a playable browser game file by file (Phaser), which the user plays with a Play button. '
        + 'kind "ai" makes an AI game with live AI characters and generated content that runs in LumaBrowser.',
      params: {
        task: { type: 'string', required: true, description: 'The game premise, with every detail the user gave.' },
        name: { type: 'string', description: 'Optional game name.' },
        kind: { type: 'string', description: '"web" (default, exportable) or "ai".' },
      },
    },
  ];

  static spec() {
    return { targets: GameDelegate.TARGETS, start: ({ args }) => GameDelegate.start(args) };
  }

  static start(args) {
    const premise = GameDelegate._text(args && args.task);
    const name = GameDelegate._text(args && args.name);
    const kind = args && args.kind === 'ai' ? 'ai' : 'web';
    const naming = name ? `\nName it "${name}".` : '';
    return {
      data: { kind, premise, ...(name ? { name } : {}) },
      message: kind === 'ai' ? GameDelegate._aiGame(premise, naming) : GameDelegate._webGame(premise, naming),
      title: name || premise,
    };
  }

  static _aiGame(premise, naming) {
    return `Build this AI-driven game: ${premise}${naming}\n\n`
      + 'Start with a minimal playable core loop (index.html + BootScene that awaits AI.ready() + GameScene with '
      + 'the main mechanic) that includes ONE real AI-driven moment: a character I can talk to, or a room the '
      + 'model generates, with a hand-written fallback for when the AI is offline. Save progress in AI.store. '
      + 'Tell me to press Play, and we\'ll iterate from there.';
  }

  static _webGame(premise, naming) {
    return `Build this game: ${premise}${naming}\n\nStart with a minimal playable core loop (index.html + BootScene + GameScene with the main mechanic), tell me to press Play, and we'll iterate from there.`;
  }

  static _text(value) {
    return (value && String(value).trim()) || '';
  }
}

module.exports = GameDelegate;
