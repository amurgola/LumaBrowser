class StreamedErrorBody {
  static async materialize(error) {
    const data = error && error.response && error.response.data;
    if (!data || typeof data.on !== 'function') return error;
    try {
      error.response.data = StreamedErrorBody._parse(await StreamedErrorBody._drain(data));
    } catch (_) {}
    return error;
  }

  static _drain(stream) {
    return new Promise((resolve, reject) => {
      let text = '';
      stream.on('data', (chunk) => { text += chunk.toString('utf8'); });
      stream.on('end', () => resolve(text));
      stream.on('error', reject);
    });
  }

  static _parse(text) {
    try {
      return JSON.parse(text);
    } catch (_) {
      return { error: { message: text } };
    }
  }
}

module.exports = StreamedErrorBody;
