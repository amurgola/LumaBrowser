(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.RP_SHARED = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const RP_DATA_VERSION = 1;

  function activeScene(data) {
    data = data || {};
    const scenes = Array.isArray(data.scenes) ? data.scenes : [];
    const stateSceneId = data.currentState && data.currentState.sceneId;
    return scenes.find((s) => s.id === stateSceneId)
      || scenes.find((s) => s.id === data.activeSceneId)
      || scenes[0]
      || null;
  }

  function currentStateEntries(data) {
    data = data || {};
    const chars = Array.isArray(data.characters) ? data.characters : [];
    const entries = data.currentState && Array.isArray(data.currentState.characters)
      ? data.currentState.characters : [];
    return entries
      .filter((s) => s && s.present !== false)
      .map((s) => {
        const char = chars.find((c) => (s.charId && c.id === s.charId)
          || (s.name && c.name && c.name.toLowerCase() === String(s.name).toLowerCase()));
        return char ? { char, state: s } : null;
      })
      .filter(Boolean);
  }

  function charactersForCurrentMoment(data, content) {
    const fromState = currentStateEntries(data);
    if (fromState.length) return fromState;

    data = data || {};
    const chars = Array.isArray(data.characters) ? data.characters : [];
    const lower = String(content || '').toLowerCase();
    return chars
      .filter((c) => c.name && lower.includes(String(c.name).toLowerCase()))
      .map((char) => ({ char, state: null }));
  }

  function normOutfit(s) {
    return String(s || '').toLowerCase().replace(/[^a-z0-9, ]/g, '').replace(/\s+/g, ' ').trim();
  }

  function characterBodyRef(c) {
    if (!c) return null;
    const outfits = Array.isArray(c.outfits) ? c.outfits : [];
    const cur = c.currentOutfit && outfits.find((o) => o && o.id === c.currentOutfit);
    if (cur && cur.b64) return cur.b64;
    if (c.figure && c.figure.b64) return c.figure.b64;
    if (c.art && c.art.fullBody && c.art.fullBody.b64) return c.art.fullBody.b64;
    if (c.art && c.art.base && c.art.base.b64) return c.art.base.b64;
    if (c.avatar && c.avatar.b64) return c.avatar.b64;
    return null;
  }

  function characterBodyRefForState(c, state) {
    if (c && state) {
      const outfits = Array.isArray(c.outfits) ? c.outfits : [];
      if (state.outfitId) {
        const byId = outfits.find((o) => o && o.id === state.outfitId && o.b64);
        if (byId) return byId.b64;
      }
      if (state.outfitDesc) {
        const want = normOutfit(state.outfitDesc);
        const byDesc = want && outfits.find((o) => o && o.b64 && normOutfit(o.desc) === want);
        if (byDesc) return byDesc.b64;
      }
    }
    return characterBodyRef(c);
  }

  const SETUP_ART = {
    basePrefix: 'character portrait, head and shoulders, detailed face,',
    baseSuffix: 'No clothing, nude shoulders, solid white background.',
    scenePrefix: 'wide establishing shot of an empty environment, no people, scenery,',
    fullBody: 'Image 1 is the face identity reference only. Create a full-body character reference of the same person with realistic adult human body proportions, a normal-sized head about one-eighth of the full standing height, shoulders and torso in proportion to the head, long legs, a tall slender grown-up figure, standing upright. Photograph the whole figure straight-on at eye level, the camera directly in front at chest height, a flat even full-length front view. Show from head to shoes, with the body filling most of the frame. Same face, same eye color, same hairstyle, same hair color, same identity, one single person. Centered, full outfit, solo, solid white background.',
    emotions: {
      happy: 'Image 1 is the base portrait and defines the hairstyle, hair color, face shape, and identity. Preserve identity, but allow the facial expression to change naturally: eyes, eyelids, eyebrows, cheeks, and mouth may move. Make a happy warm smile. If eyes are visible, keep the same eye color. Head and shoulders, solo, plain background.',
      sad: 'Image 1 is the base portrait and defines the hairstyle, hair color, face shape, and identity. Preserve identity, but allow the facial expression to change naturally: eyes, eyelids, eyebrows, cheeks, and mouth may move. Make the expression sad and downcast, with soft frown and lowered eyes. If eyes are visible, keep the same eye color. Head and shoulders, solo, plain background.',
      angry: 'Image 1 is the base portrait and defines the hairstyle, hair color, face shape, and identity. Preserve identity, but allow the facial expression to change strongly: eyes, eyelids, eyebrows, cheeks, and mouth may move. Make the expression clearly angry: furrowed brows, narrowed eyes, hard glare, tense mouth, slight scowl. Not sad, not worried, not smiling. If eyes are visible, keep the same eye color. Head and shoulders, solo, plain background.',
    },
  };

  function migrateData(data) {
    if (!data || typeof data !== 'object') return false;
    let changed = false;
    const chars = Array.isArray(data.characters) ? data.characters : [];
    for (const c of chars) {
      if (!c) continue;
      if (!Number.isFinite(c.seed)) {
        c.seed = Math.floor(Math.random() * 2000000000);
        changed = true;
      }
      if (c.avatar && c.avatar.b64 && !(c.art && c.art.base && c.art.base.b64)) {
        c.art = Object.assign({}, c.art, { base: { b64: c.avatar.b64, mime: c.avatar.mime || 'image/png' } });
        changed = true;
      }
      if (c.art && c.art.fullBody && c.art.fullBody.b64 && !(c.figure && c.figure.b64)) {
        c.figure = { b64: c.art.fullBody.b64, mime: c.art.fullBody.mime || 'image/png' };
        changed = true;
      }
    }
    if (data.version !== RP_DATA_VERSION) {
      data.version = RP_DATA_VERSION;
      changed = true;
    }
    return changed;
  }

  return {
    RP_DATA_VERSION,
    SETUP_ART,
    activeScene,
    currentStateEntries,
    charactersForCurrentMoment,
    normOutfit,
    characterBodyRef,
    characterBodyRefForState,
    migrateData,
  };
}));
