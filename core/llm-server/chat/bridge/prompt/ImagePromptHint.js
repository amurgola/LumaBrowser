class ImagePromptHint {
  static MAX_NEGATIVE_CHARS = 160;

  static async fetch(imageRouter) {
    if (!imageRouter || !imageRouter.getActivePromptInfo) return null;
    try {
      const frames = typeof imageRouter.getFrameSizes === 'function' ? await imageRouter.getFrameSizes(null) : null;
      const editInfo = typeof imageRouter.getEditPromptInfo === 'function' ? await imageRouter.getEditPromptInfo() : null;
      return ImagePromptHint.build(await imageRouter.getActivePromptInfo('generate'), frames, editInfo);
    } catch (_) {
      return null;
    }
  }

  static build(info, frames = null, editInfo = null) {
    const lines = [
      ...ImagePromptHint._generationLines(info),
      ...(editInfo && editInfo.guide ? [editInfo.guide] : []),
      ...ImagePromptHint._frameLines(frames),
    ];
    return lines.length ? lines.join('\n') : null;
  }

  static _generationLines(info) {
    if (!info || !info.promptGuide) return [];
    const lines = [
      `ACTIVE IMAGE MODEL: PROMPTING GUIDE for generate_image (the configured generation model is "${info.label || info.modelId}"):`,
      info.promptGuide,
    ];
    if (info.negativePrompt) {
      const max = ImagePromptHint.MAX_NEGATIVE_CHARS;
      const neg = info.negativePrompt.length > max ? info.negativePrompt.slice(0, max - 3) + '…' : info.negativePrompt;
      lines.push(
        `A sensible default negative prompt is applied automatically for this model `
        + `(e.g. "${neg}"), so you do NOT need to supply one; only add a negative if `
        + `the user explicitly wants to exclude something specific.`);
    }
    return lines;
  }

  static _frameLines(frames) {
    if (!frames || !Array.isArray(frames.frames) || !frames.frames.length) return [];
    const parts = frames.frames.map((f) => (f.width && f.height)
      ? `${f.frame} ${f.width}x${f.height} (${f.use})`
      : `${f.frame} = source shape (${f.use})`);
    return [`edit_image FRAMES on the edit model "${frames.label || frames.modelId}": ${parts.join('; ')}. `
      + 'Use match unless the request changes the composition.'];
  }
}

module.exports = ImagePromptHint;
