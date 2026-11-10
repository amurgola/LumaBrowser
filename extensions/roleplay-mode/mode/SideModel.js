const HostGlobals = require('../HostGlobals');

class SideModel {
  static HELPER = 'helper';

  static ref(data, router = HostGlobals.chatRouter()) {
    const d = data || {};
    const story = typeof d.llmModel === 'string' && d.llmModel ? d.llmModel : undefined;
    const pick = typeof d.sideModel === 'string' ? d.sideModel.trim() : '';
    if (!pick) return story;
    if (pick === SideModel.HELPER) return SideModel.helperRef(router) || story;
    return pick;
  }

  static helperRef(router = HostGlobals.chatRouter()) {
    try {
      return router && typeof router.helperModelRef === 'function' ? (router.helperModelRef() || null) : null;
    } catch (_) {
      return null;
    }
  }

  static split(data, router = HostGlobals.chatRouter()) {
    const d = data || {};
    const side = SideModel.ref(d, router);
    return !!side && side !== (d.llmModel || undefined);
  }
}

module.exports = SideModel;
