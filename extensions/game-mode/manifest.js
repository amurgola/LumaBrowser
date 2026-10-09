module.exports = {
  id: 'game-mode',
  name: 'Game',
  version: '0.1.0',
  private: true,
  distributable: false,
  description:
    'A game studio in the LLM chat. Describe a game and an agent designs and '
    + 'builds it as a real, playable Phaser 3 project on disk: scenes, entities, '
    + 'state management, UI components, generated art. Then you hit Play. Edit '
    + 'mode is the ongoing conversation; Play mode runs the game. Choose a web '
    + 'game (exportable, plays anywhere) or an AI game that runs inside '
    + 'LumaBrowser and calls the model while it plays: characters that speak in '
    + 'their own words, dungeons and quests generated on the fly, events the AI '
    + 'drives through game functions you expose, and persistent data stores.',

  dependencies: {
    optional: {
      'core:llm-service': {},
      'core:database': {},
      'core:browser': {},
    },
  },

  chatUi: {
    file: './chat-ui.js',
    assets: [
      './game.css',
      './ui/GameChatMode.js', './ui/GameKickoff.js', './ui/GamePanelActions.js', './ui/GamePanelMarkup.js',
      './ui/GamePlayOverlay.js', './ui/GameServerApi.js', './ui/GameSetupSchema.js', './ui/GameStatusPanel.js',
    ],
  },

  routes: { file: './routes.js' },

  extensionsActions: [
    {
      label: 'Make a game',
      variant: 'primary',
      gate: 'llm',
      modeIntent: 'game',
      prompt: {
        title: 'Make a game',
        subtitle: 'Describe the game you want. The agent designs, builds, and iterates on it with you. Then you press Play.',
        submitLabel: 'Start building',
        fields: [
          { key: 'premise', label: 'What game do you want?', type: 'textarea', rows: 4, required: true,
            placeholder: 'e.g. A one-button flappy clone with a night-sky theme and combo scoring.' },
          { key: 'name', label: 'Name (optional)', type: 'text', placeholder: 'Night Flap' },
        ],
      },
    },
  ],

  main: './main.js',
};
