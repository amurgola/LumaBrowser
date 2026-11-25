class GameSetupSchema {
  static GENRES = [
    { value: '', label: 'Any' },
    { value: 'platformer', label: 'Platformer' },
    { value: 'arcade', label: 'Arcade / action' },
    { value: 'shooter', label: 'Shooter' },
    { value: 'puzzle', label: 'Puzzle' },
    { value: 'top-down adventure', label: 'Top-down adventure' },
    { value: 'rpg', label: 'RPG / adventure' },
    { value: 'idle', label: 'Idle / clicker' },
  ];

  static build() {
    return {
      title: 'New game',
      subtitle: 'Describe the game you want. The agent builds it file by file; you press Play whenever you like.',
      submitLabel: 'Start building',
      fields: [
        {
          key: 'kind',
          label: 'Game type',
          type: 'select',
          options: [
            { value: 'web', label: 'Web game (exportable, plays anywhere)' },
            { value: 'ai', label: 'AI game (runs in LumaBrowser; live AI characters, generated content)' },
          ],
        },
        {
          key: 'premise',
          label: 'What game do you want?',
          type: 'textarea',
          required: true,
          placeholder: 'e.g. A one-button flappy clone with a night-sky theme and combo scoring.',
        },
        {
          key: 'worldNotes',
          label: 'World notes',
          type: 'textarea',
          hint: '(optional) tone, rules, lore; sent to the in-game AI on every call',
          placeholder: 'e.g. Grim low-fantasy. Magic is rare and costs something. NPCs never break character.',
          showIf: { key: 'kind', equals: 'ai' },
        },
        { key: 'name', label: 'Name', type: 'text', half: true, hint: '(optional)', placeholder: 'Night Flap' },
        { key: 'genre', label: 'Genre', type: 'select', half: true, options: GameSetupSchema.GENRES },
        {
          key: 'palette',
          label: 'Colour palette',
          type: 'select',
          half: true,
          hint: 'pixel art is drawn in or snapped to it, so every asset matches',
          options: [
            { value: '', label: 'Let the image model pick' },
            { value: 'pico-8', label: 'PICO-8 (16)' },
            { value: 'game-boy', label: 'Game Boy (4 greens)' },
            { value: 'sweetie-16', label: 'Sweetie 16' },
            { value: 'endesga-32', label: 'Endesga 32' },
            { value: 'custom', label: 'My own colours' },
          ],
        },
        {
          key: 'paletteCustom',
          label: 'Palette colours',
          type: 'textarea',
          hint: 'hex colours, any separator (a Lospec .hex file pasted in works)',
          placeholder: '#1a1c2c #5d275d #b13e53 #ef7d57 #ffcd75 ...',
          showIf: { key: 'palette', equals: 'custom' },
        },
      ],
    };
  }
}

module.exports = GameSetupSchema;
