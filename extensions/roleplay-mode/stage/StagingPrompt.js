const CastResolver = require('../world/CastResolver');

class StagingPrompt {
  static POSES = ['standing', 'sitting', 'kneeling', 'lying', 'away', 'jumping'];
  static PASSAGE_MAX = 4000;

  static messages(data, content) {
    const d = data || {};
    const system = StagingPrompt._instructions() + StagingPrompt._context(d);
    const user = 'Passage:\n"""\n' + String(content || '').slice(0, StagingPrompt.PASSAGE_MAX) + '\n"""\n\nJSON:';
    return [{ role: 'system', content: system }, { role: 'user', content: user }];
  }

  static _instructions() {
    return '/no_think\n'
      + 'You are the STAGE MANAGER for an illustrated roleplay: continuity '
      + 'tracker, wardrobe supervisor and shot director in one. Read the passage '
      + 'and report the world-state AFTER it, plus the single best shot for this '
      + 'moment\'s illustration. Respond with ONLY a single minified JSON object '
      + 'and nothing else: no prose, no code fences, no explanation.\n'
      + StagingPrompt._schema()
      + 'Rules:\n'
      + StagingPrompt._castRules()
      + StagingPrompt._wardrobeRules()
      + StagingPrompt._shotRules();
  }

  static _schema() {
    return 'Schema: {"newCharacters":[{"name":string,"looks":string,"personality":string}],'
      + '"location":{"name":string,"desc":string,"isNew":boolean},'
      + '"present":[{"name":string,"present":boolean,"emotion":string,"outfit":string,'
      + '"slots":{"outer":string,"top":string,"bottom":string,"feet":string},'
      + '"head":string,"face":string,"outfitChanged":boolean}],'
      + '"shot":{"pose":one of [' + StagingPrompt.POSES.join(', ') + '],"facing":"camera"|"away",'
      + '"framing":"full"|"close","focus":[names],"group":boolean,"contact":boolean,'
      + '"action":string,"props":[strings]}}\n';
  }

  static _castRules() {
    return '- newCharacters: characters newly introduced in this passage, or whose '
      + 'physical appearance is revealed for the first time. "looks" = a short '
      + 'comma-separated visual description for an image generator (hair, build, '
      + 'features). "personality" = a short phrase. Do NOT include the protagonist/'
      + 'the player. Use [] if none.\n'
      + '- location: the place the action is currently happening. "name" must be a '
      + 'SHORT, GENERAL, REUSABLE place name (e.g. "the street", "the dormitory", '
      + '"the dining hall"), NOT an overly specific or proper name; the same kind '
      + 'of place should get the same name so it is recognised and reused later. If '
      + 'the place is the same as or essentially equivalent to one in the known '
      + 'locations list, REUSE that exact known name and set "isNew": false. '
      + '"isNew" is true only for a genuinely new place. Omit the whole "location" '
      + 'key if the passage does not clearly establish a place.\n'
      + '- present: the non-player characters physically present with the '
      + 'protagonist AFTER this passage, one entry each, exact names. Mark '
      + 'present=false only when a known character clearly just left; otherwise '
      + 'omit absent characters. When the protagonist MOVES to a different place, '
      + 'presence resets: only characters described at the NEW location are '
      + 'present; anyone left behind at the previous location must be marked '
      + 'present=false, even if they were present a moment ago. '
      + '"emotion" = a brief current mood.\n';
  }

  static _wardrobeRules() {
    return '- outfit: the FULL outfit that character is realistically wearing RIGHT '
      + 'NOW, as a SHORT comma-separated description (e.g. "navy school blazer, '
      + 'white shirt, plaid skirt, loafers" or "just a towel"), always the '
      + 'complete current outfit, never just the change. If the passage describes '
      + 'their clothing, honour it. If it is silent, choose what makes sense for '
      + 'THIS place/occasion and is consistent with their known wardrobe (a school '
      + '→ a uniform or student clothes; a pool/beach → swimwear; a formal event → '
      + 'eveningwear; bed → sleepwear; training/combat → practical gear); do NOT '
      + 'leave them in a previous scene\'s clothes when those no longer fit. If '
      + 'their known wardrobe already contains an outfit that suits this scene, '
      + 'reuse that exact description. If a garment comes off, the outfit is what '
      + 'remains, including what is absent when it matters (e.g. "white dress '
      + 'shirt, loosened tie, suit trousers, no jacket").\n'
      + '- If their "currently wearing" outfit below still fits the scene and has '
      + 'NOT changed, return it VERBATIM: copy the exact same wording, do not '
      + 'reword, abbreviate, or drop adjectives, and set "outfitChanged": false. '
      + '"outfitChanged" is true only when they put on, took off, loosened, '
      + 'removed, swapped or changed clothing in THIS passage, or the new setting '
      + 'forces a different outfit.\n'
      + '- slots: the SAME outfit split into layers. "outer" = a coat/jacket/cloak '
      + 'worn OVER the top ("" if none). "top" = the shirt/blouse/dress/upper '
      + 'garment. "bottom" = the skirt/trousers/shorts ("" when a dress already '
      + 'covers it). "feet" = shoes/boots/sandals ("" if barefoot). Each slot is a '
      + 'short phrase consistent with "outfit"; a removed garment is simply "" in '
      + 'its slot.\n'
      + '- head / face: ONLY items worn ON the head (hat, hood, headband, hair '
      + 'ornament, animal ears) / ON the face (glasses, eyepatch, mask), '
      + 'comma-separated, or "" if none. Track these separately so they survive '
      + 'expression changes.\n';
  }

  static _shotRules() {
    return '- shot: the illustration of THIS moment. "pose" = the dominant body pose '
      + 'of the focus character(s); use "away" ONLY when they are clearly turned '
      + 'away / showing their back. "facing" = "away" only for a deliberate '
      + 'back-view beat, else "camera". "framing" = "full" for a whole-body/action '
      + 'beat, "close" for a dialogue or emotional close-up. "focus" = the 1-2 '
      + 'present characters the image should center on (exact names); "group": '
      + 'true if two characters share the frame. "contact": true ONLY when this '
      + 'beat contains physical interaction (kissing, hugging, carrying, dancing '
      + 'together, grappling, leaning on each other, or physically handling an '
      + 'object or animal), so the moment cannot be drawn as separate figures '
      + 'standing apart. Interaction WITH THE PROTAGONIST counts: a character '
      + 'kissing, embracing or touching the protagonist is contact:true even '
      + 'though the protagonist is not listed. Ordinary talking or sitting near '
      + 'each other → false. "action": when contact is true or a prop matters, a '
      + 'SHORT visual phrase describing the physical beat exactly as it should be '
      + 'drawn (e.g. "kissing, faces close together, eyes closed"), else "". '
      + '"props": objects or animals (NEVER people) newly CENTRAL to this beat '
      + 'that the image must be about (e.g. "a small orange cat" being petted), '
      + 'NOT items merely carried, worn or handled in passing (a stack of books, '
      + 'a satchel, a lamp). Use [] if none.\n';
  }

  static _context(d) {
    const scenes = Array.isArray(d.scenes) ? d.scenes : [];
    const knownScenes = scenes.map((s) => s.name).filter(Boolean);
    const currentState = d.currentState || {};
    const currentScene = scenes.find((s) => s.id === currentState.sceneId) || scenes.find((s) => s.id === d.activeSceneId);
    const roster = StagingPrompt._roster(d);
    const currentPeople = StagingPrompt._currentPeople(d);
    return 'Known characters:\n' + (roster.length ? roster.join('\n') : '(none)') + '\n'
      + 'Prior current scene: ' + (currentScene && currentScene.name ? currentScene.name : '(unknown)') + '\n'
      + 'Prior present characters: ' + (currentPeople.length ? currentPeople.join(' | ') : '(none)') + '\n'
      + 'Known locations: ' + (knownScenes.length ? knownScenes.join(', ') : '(none)');
  }

  static _roster(d) {
    const chars = Array.isArray(d.characters) ? d.characters : [];
    return chars
      .filter((c) => c && c.name)
      .map((c) => {
        const known = Array.isArray(c.outfits) ? c.outfits.map((o) => o && o.desc).filter(Boolean) : [];
        return '- ' + c.name
          + ' | currently wearing: ' + (c.currentOutfitDesc || '(unknown)')
          + (known.length ? ' | known wardrobe: ' + known.join('; ') : '');
      });
  }

  static _currentPeople(d) {
    return CastResolver.currentEntries(d).map(({ char, state }) => {
      const outfit = (state && state.outfitDesc) || char.currentOutfitDesc || '';
      const emotion = state && state.emotion ? ', emotion: ' + state.emotion : '';
      return char.name + (outfit ? ', wearing: ' + outfit : '') + emotion;
    });
  }
}

module.exports = StagingPrompt;
