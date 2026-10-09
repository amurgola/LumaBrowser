export default class RamPin {
  static async enable(llm, image) {
    if (await RamPin._unsupported(llm)) return { ok: false, skipped: 'unsupported' };
    let ok = true;
    try { if (llm && llm.setDefaults) await llm.setDefaults({ pinModelRam: true }); } catch (_) { ok = false; }
    try { if (image && image.setDefaults) await image.setDefaults({ pinModelRam: true }); } catch (_) { ok = false; }
    return { ok };
  }

  static async _unsupported(llm) {
    try {
      if (llm && typeof llm.getRamPinStatus === 'function') {
        const reply = await llm.getRamPinStatus();
        const status = reply && (reply.status || reply);
        return !!(status && status.supported === false);
      }
    } catch (_) {}
    return false;
  }
}
