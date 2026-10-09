class TextDrip {
  static CHUNK_CHARS = 24;
  static INTERVAL_MS = 18;

  static async play(text, onDelta, shouldAbort) {
    if (!text) return;
    for (let i = 0; i < text.length; i += TextDrip.CHUNK_CHARS) {
      if (shouldAbort && shouldAbort()) return;
      onDelta(text.slice(i, i + TextDrip.CHUNK_CHARS));
      if (i + TextDrip.CHUNK_CHARS < text.length) await TextDrip._pause();
    }
  }

  static _pause() {
    return new Promise((resolve) => setTimeout(resolve, TextDrip.INTERVAL_MS));
  }
}

module.exports = TextDrip;
