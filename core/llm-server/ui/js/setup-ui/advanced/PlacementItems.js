export default class PlacementItems {
  static ITEMS = [
    { key: 'llm', label: 'LLM', cls: 'llm' },
    { key: 'imageGenerate', label: 'Image · Generate', cls: 'gen' },
    { key: 'imageEdit', label: 'Image · Edit', cls: 'edit' },
    { key: 'imageVideo', label: 'Video', cls: 'video' },
    { key: 'music', label: 'Music', cls: 'music' },
    { key: 'grounding', label: 'Grounding', cls: 'grounding' },
  ];

  static CONTEXT_KEY = 'llmContext';

  static meta(key) {
    return PlacementItems.ITEMS.find((i) => i.key === key) || null;
  }

  static defaultContext() {
    return { enabled: false, location: 'vram' };
  }

  static emptyLayout() {
    const items = { [PlacementItems.CONTEXT_KEY]: PlacementItems.defaultContext() };
    for (const it of PlacementItems.ITEMS) items[it.key] = null;
    return {
      version: 2,
      resources: [{ id: 'ram', kind: 'ram', devices: [] }],
      singularities: [],
      items,
    };
  }
}
