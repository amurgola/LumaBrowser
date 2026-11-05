import TurnData from '../../turns/TurnData.js';

export default class MediaGallery {
  static KINDS = new Set(['image', 'video']);

  static collect(state) {
    const out = [];
    const seen = new Set();
    const messages = (state && Array.isArray(state.messages)) ? state.messages.slice() : [];
    if (state && state.streamMsg && !messages.includes(state.streamMsg) && state.streamOnScreen && state.streamOnScreen()) {
      messages.push(state.streamMsg);
    }
    for (const m of messages) {
      for (const af of TurnData.artifacts(m)) {
        if (!af || !af.id || seen.has(af.id) || !MediaGallery.KINDS.has(af.type || '')) continue;
        seen.add(af.id);
        out.push({ artifact: af, message: m });
      }
    }
    return out;
  }

  static around(state, artifact) {
    const items = MediaGallery.collect(state);
    const index = items.findIndex((it) => it.artifact.id === artifact.id);
    if (index >= 0) return { items, index };
    return { items: [{ artifact, message: null }], index: 0 };
  }
}
