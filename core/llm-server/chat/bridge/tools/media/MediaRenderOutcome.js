const ImageServerLogTail = require('./ImageServerLogTail');

class MediaRenderOutcome {
  static failureOf(result, sink, isAborted, tool, kind) {
    if (isAborted && isAborted()) return { success: false, error: 'stopped' };
    if (result && result.success === false) {
      return { success: false, error: kind.explain(result.error || sink.lastError || `${tool} failed.`) };
    }
    if (sink.lastError) return { success: false, error: kind.explain(sink.lastError) };
    if (!kind.hasOutput(result)) return { success: false, error: kind.explain(kind.emptyMessage) };
    return null;
  }

  static images(tool) {
    return {
      hasOutput: (result) => ((result && result.images) || []).length > 0,
      emptyMessage: `${tool} returned no images.`,
      explain: (message) => ImageServerLogTail.append(message),
    };
  }

  static video(tool) {
    return {
      hasOutput: (result) => !!(result && result.video && result.video.bytes),
      emptyMessage: `${tool} returned no video.`,
      explain: (message) => message,
    };
  }

  static audio(tool) {
    return {
      hasOutput: (result) => !!(result && result.audio && result.audio.b64),
      emptyMessage: `${tool} returned no audio.`,
      explain: (message) => message,
    };
  }
}

module.exports = MediaRenderOutcome;
