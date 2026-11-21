class LoopCoreLayout {
  static of(gguf) {
    const core = gguf && gguf.loopCore;
    if (!core) return null;
    const start = Number(core.start);
    const end = Number(core.end);
    const passes = Number(core.passes);
    const blocks = Number(gguf.blockCount) || 0;
    if (!(Number.isInteger(passes) && passes >= 2 && start >= 0 && end > start && end <= blocks)) return null;
    return {
      start,
      end,
      passes,
      extraSlots: (passes - 1) * (end - start),
      visitsAt: (index) => (index >= start && index < end ? passes : 1),
    };
  }

  static rewindsByCheckpoint(gguf) {
    return !!LoopCoreLayout.of(gguf);
  }

  static visitsAt(gguf, index) {
    const layout = LoopCoreLayout.of(gguf);
    return layout ? layout.visitsAt(index) : 1;
  }
}

module.exports = LoopCoreLayout;
