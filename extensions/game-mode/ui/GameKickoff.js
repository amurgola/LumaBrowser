export default class GameKickoff {
  static message(data) {
    const premise = data && data.premise ? String(data.premise).trim() : '';
    const name = data && data.name ? String(data.name).trim() : '';
    if (!premise) return 'Help me design and build a game. Ask me what I want to play.';
    const naming = name ? `\nName it "${name}".` : '';
    return data.kind === 'ai' ? GameKickoff._aiGame(premise, naming) : GameKickoff._webGame(premise, naming);
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
}
