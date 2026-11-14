const ImageServerLogTail = require('./ImageServerLogTail');

class MediaRenderOutcome {
  static serverFailedNote(serverName) {
    return `The ${serverName} server failed, not the request: calling this tool again this turn will not help. `
      + 'Do not retry. Tell the user what failed, using the error above.';
  }

  static failureOf(result, sink, isAborted, tool, kind) {
    if (isAborted && isAborted()) return { success: false, error: 'stopped' };
    const message = MediaRenderOutcome._failureMessage(result, sink, tool, kind);
    if (message == null) return null;
    return { success: false, error: MediaRenderOutcome._withServerNote(kind.explain(message), result, sink, kind) };
  }

  static images(tool) {
    return {
      hasOutput: (result) => ((result && result.images) || []).length > 0,
      emptyMessage: `${tool} returned no images.`,
      explain: (message) => ImageServerLogTail.append(message),
      serverName: 'image',
    };
  }

  static video(tool) {
    return {
      hasOutput: (result) => !!(result && result.video && result.video.bytes),
      emptyMessage: `${tool} returned no video.`,
      explain: (message) => message,
      serverName: 'video',
    };
  }

  static audio(tool) {
    return {
      hasOutput: (result) => !!(result && result.audio && result.audio.b64),
      emptyMessage: `${tool} returned no audio.`,
      explain: (message) => message,
    };
  }

  static _failureMessage(result, sink, tool, kind) {
    if (result && result.success === false) return result.error || sink.lastError || `${tool} failed.`;
    if (sink.lastError) return sink.lastError;
    if (!kind.hasOutput(result)) return kind.emptyMessage;
    return null;
  }

  static _withServerNote(error, result, sink, kind) {
    if (!kind.serverName || !sink.reachedServer || (result && result.aborted)) return error;
    return `${error}\n${MediaRenderOutcome.serverFailedNote(kind.serverName)}`;
  }
}

module.exports = MediaRenderOutcome;
