class VisionHint {
  static forTurn(imageCount, visionActive) {
    if (!imageCount || !visionActive) return null;
    const one = imageCount === 1;
    return `The user attached ${imageCount} image${one ? '' : 's'} to this message, provided to you directly as visual input (NOT via a web page). Look at ${one ? 'it' : 'them'} and respond directly: transcribe, describe, or analyze the image content as asked. Do NOT use the screenshot tool or any browser tool to try to "view" the attachment; it is already visible to you.`;
  }
}

module.exports = VisionHint;
