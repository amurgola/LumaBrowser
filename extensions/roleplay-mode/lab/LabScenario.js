class LabScenario {
  static STYLE = 'anime, cel-shaded, soft magical lighting';
  static LORA_LOOKS = 'a shy, quirky young woman with vibrant red hair in an asymmetric undercut, wearing a loose lavender sundress and a thin silver chain with a brass compass pendant';
  static LORA_OUTFIT = 'lavender sundress, thin silver chain with a brass compass pendant';
  static SCENE_DESC = 'a cavernous magic-college study hall, floating azure orbs, heavy oak tables, books that shuffle their pages, runes glowing amber on the stone floor';
  static SEARCH_LIMIT = 50;
  static RUN_OPTIONS = {
    autoImage: true, sceneBackground: true, autoAvatarArt: false, artAudit: true,
    imageProfile: 'balanced', harmonizeMode: 'auto',
  };

  constructor({ imageDefaults = () => null, chatStore = () => null } = {}) {
    this._imageDefaults = imageDefaults;
    this._chatStore = chatStore;
  }

  current() {
    return this._real() || this.fallback();
  }

  fallback() {
    const models = this._models({});
    return {
      scenario: 'A magic college in the style of anime + Harry Potter. The protagonist studies alongside Lora.',
      style: LabScenario.STYLE,
      baseModel: models.baseModel, editModel: models.editModel,
      characters: [{
        id: 'lora', name: 'Lora',
        appearance: LabScenario.LORA_LOOKS,
        description: LabScenario.LORA_LOOKS,
        seed: 1337,
        currentOutfit: null,
        currentOutfitDesc: LabScenario.LORA_OUTFIT,
        outfits: [],
        art: null,
      }],
      scenes: [{ id: 'study-hall', name: 'Study Hall', description: LabScenario.SCENE_DESC, bg: null }],
      activeSceneId: 'study-hall',
      currentState: { sceneId: 'study-hall', characters: [{ charId: 'lora', present: true, emotion: '', outfitDesc: LabScenario.LORA_OUTFIT, outfitId: null }] },
      options: Object.assign({}, LabScenario.RUN_OPTIONS, { harmonize: false, harmonizeStrength: 0 }),
      images: {},
    };
  }

  _real() {
    try {
      const store = this._chatStore();
      if (!store || typeof store.listConversations !== 'function') return null;
      for (const c of store.listConversations({ limit: LabScenario.SEARCH_LIMIT }) || []) {
        const meta = store.getMeta(c.id);
        if (LabScenario._isUsable(meta)) return this._prepare(JSON.parse(JSON.stringify(meta.data)));
      }
    } catch (_) {}
    return null;
  }

  static _isUsable(meta) {
    const d = meta && meta.data;
    return !!(meta && meta.mode === 'roleplay' && d && Array.isArray(d.characters) && d.characters.length && d.characters[0].name);
  }

  _prepare(out) {
    Object.assign(out, this._models(out));
    const char = out.characters[0];
    const scene = (out.scenes || []).find((s) => s.id === out.activeSceneId) || (out.scenes || [])[0]
      || { id: 'scene', name: 'Scene', description: 'an interior room', bg: null };
    out.scenes = out.scenes && out.scenes.length ? out.scenes : [scene];
    out.activeSceneId = scene.id;
    char.outfits = [];
    char.currentOutfit = null;
    out.currentState = { sceneId: scene.id, characters: [{ charId: char.id, present: true, emotion: '', outfitDesc: char.currentOutfitDesc || '', outfitId: null }] };
    out.options = Object.assign({}, LabScenario.RUN_OPTIONS, out.options || {});
    out._real = true;
    return out;
  }

  _models(data) {
    let baseModel = data.baseModel || null;
    let editModel = data.editModel || null;
    try {
      const im = this._imageDefaults();
      baseModel = baseModel || (im && im.modelId) || null;
      editModel = editModel || (im && (im.editModelId || im.modelId)) || null;
    } catch (_) {}
    return { baseModel, editModel };
  }
}

module.exports = LabScenario;
