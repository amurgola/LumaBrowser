const GameKind = require('../session/GameKind');
const GamePromptBlocks = require('./GamePromptBlocks');
const GameAssetRules = require('./GameAssetRules');
const GameWorkflowRules = require('./GameWorkflowRules');

class GameSystemPrompt {
  static WEB_PERSONA = 'You are the Game agent inside LumaBrowser: a senior game developer who ships complete, '
    + 'playable browser games with Phaser 3. Bias toward FINISHING a playable core loop before '
    + 'polish. Make the game feel good: responsive input, feedback on every action (tweens, '
    + 'camera shake, score pops), and a clear fail/win state. Be concise in chat.';

  static AI_PERSONA = 'You are the Game agent inside LumaBrowser: a senior game developer who ships complete, '
    + 'playable browser games with Phaser 3; here, an AI-DRIVEN game whose characters, content, and '
    + 'events are generated live by a language model through the AI runtime. Bias toward FINISHING a '
    + 'playable core loop with one real AI moment before polish. Make the game feel good: responsive '
    + 'input, feedback on every action, a visible thinking state whenever the model is working, and a '
    + 'clear fail/win state. Be concise in chat.';

  static build(data = {}, opts = {}) {
    const ai = data.kind === GameKind.AI;
    return [
      ai ? GameSystemPrompt.AI_PERSONA : GameSystemPrompt.WEB_PERSONA,
      GamePromptBlocks.GAME_PROJECT,
      ai ? GamePromptBlocks.AI_RUNTIME : '',
      GamePromptBlocks.PHASER_GROUNDING,
      GamePromptBlocks.KNOWLEDGE,
      GameAssetRules.render({
        imageReady: !!opts.imageReady,
        artStyle: opts.artStyle || data.artStyle,
        alpha: !!opts.alpha,
        models: opts.models || null,
      }),
      opts.hasTools ? GameWorkflowRules.render(ai) : GamePromptBlocks.NO_TOOL_WORKFLOW,
      GameSystemPrompt._goal(data, ai),
    ].filter(Boolean).join('\n\n');
  }

  static _goal(data, ai) {
    const premise = GameSystemPrompt._text(data.premise);
    if (!premise) return '<user_goal>\nNo game brief yet; ask the user what game they want, then proceed.\n</user_goal>';
    const name = GameSystemPrompt._text(data.name);
    const genre = GameSystemPrompt._text(data.genre);
    const worldNotes = ai ? GameSystemPrompt._text(data.worldNotes) : '';
    return `<user_goal>\nThe user wants this ${ai ? 'AI-driven ' : ''}game:\n${premise}\n`
      + (name ? `Name: ${name}.\n` : '')
      + (genre ? `Genre: ${genre}.\n` : '')
      + (worldNotes ? `World notes (the in-game model receives these on every call; build the game to match them):\n${worldNotes}\n` : '')
      + '</user_goal>';
  }

  static _text(value) {
    return value ? String(value).trim() : '';
  }
}

module.exports = GameSystemPrompt;
