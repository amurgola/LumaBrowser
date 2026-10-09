export default class StreamFrames {
  static SSE = '\n\n';
  static NDJSON = '\n';

  static async read(body, separator, onFrame) {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    for (;;) {
      const { done, value } = await reader.read();
      if (done) return false;
      buffer += decoder.decode(value, { stream: true });
      let at;
      while ((at = buffer.indexOf(separator)) >= 0) {
        const frame = buffer.slice(0, at);
        buffer = buffer.slice(at + separator.length);
        if (onFrame(frame) === true) return true;
      }
    }
  }

  static json(line) {
    const raw = String(line).trim();
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (_) {
      return null;
    }
  }
}
