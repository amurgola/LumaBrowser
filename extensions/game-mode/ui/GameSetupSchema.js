export default class GameSetupSchema {
  static SPRITE_PREFERRED = ['chroma1-flash', 'chroma1-hd'];

  static BACKDROP_PREFERRED = ['chroma1-hd', 'chroma1-flash'];

  static async fetchImageModels(api) {
    try {
      const r = await api.image.getModelsView();
      const list = (r && r.success && r.scan && r.scan.models) || [];
      return list
        .filter((m) => m.kind !== 'edit' && m.kind !== 'video')
        .map((m) => ({ value: m.id, label: m.displayName || m.id }));
    } catch (_) {
      return [];
    }
  }

  static build(imageModels) {
    const fields = GameSetupSchema._baseFields();
    if (imageModels.length) fields.push(...GameSetupSchema._modelFields(imageModels));
    return {
      title: 'New game',
      subtitle: 'Describe the game you want. The agent builds it file by file; you press Play whenever you like.',
      submitLabel: 'Start building',
      fields,
    };
  }

  static defaultPins(imageModels) {
    const have = new Set(imageModels.map((m) => m.value));
    const first = (list) => list.find((id) => have.has(id)) || '';
    return { spriteModel: first(GameSetupSchema.SPRITE_PREFERRED), backdropModel: first(GameSetupSchema.BACKDROP_PREFERRED) };
  }

  static _baseFields() {
    return [
      { key: 'kind', label: 'Game type', type: 'select',
        options: [
          { value: 'web', label: 'Web game (exportable, plays anywhere)' },
          { value: 'ai', label: 'AI game (runs in LumaBrowser: live AI characters, generated content)' },
        ] },
      { key: 'premise', label: 'What game do you want?', type: 'textarea', required: true,
        placeholder: 'e.g. A one-button flappy clone with a night-sky theme and combo scoring.' },
      { key: 'worldNotes', label: 'World notes', type: 'textarea',
        hint: '(optional) tone, rules, lore. The in-game AI receives these on every call.',
        placeholder: 'e.g. Grim low-fantasy. Magic is rare and costs something. NPCs never break character.',
        showIf: { key: 'kind', equals: 'ai' } },
      { key: 'name', label: 'Name', type: 'text', half: true, hint: '(optional)', placeholder: 'Night Flap' },
      { key: 'genre', label: 'Genre', type: 'select', half: true,
        options: [
          { value: '', label: 'Any' },
          { value: 'platformer', label: 'Platformer' },
          { value: 'arcade', label: 'Arcade / action' },
          { value: 'shooter', label: 'Shooter' },
          { value: 'puzzle', label: 'Puzzle' },
          { value: 'top-down adventure', label: 'Top-down adventure' },
          { value: 'rpg', label: 'RPG / adventure' },
          { value: 'idle', label: 'Idle / clicker' },
        ] },
      { key: 'artStyle', label: 'Art style', type: 'select', half: true,
        hint: 'default for every generated asset',
        options: [
          { value: '', label: 'Let the agent pick' },
          { value: 'pixel-art', label: 'Pixel art' },
          { value: 'cartoon', label: 'Cartoon' },
          { value: 'painted', label: 'Painted' },
          { value: 'flat', label: 'Flat / vector' },
        ] },
    ];
  }

  static _modelFields(imageModels) {
    const options = [{ value: '', label: 'Use image-server default' }].concat(imageModels);
    return [
      { key: 'spriteModel', label: 'Sprite model', type: 'select', half: true,
        hint: 'transparent sprites and assets under 256px', options },
      { key: 'backdropModel', label: 'Backdrop model', type: 'select', half: true,
        hint: 'backdrops and tiles at 256px and up', options },
    ];
  }
}
