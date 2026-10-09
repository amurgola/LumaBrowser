class ArtifactContent {
  static TYPES = ['html', 'svg', 'markdown', 'code', 'image', 'video', 'audio', 'live'];
  static DEFAULT_TYPE = 'html';
  static MEDIA_FALLBACK_MIME = { image: 'image/png', video: 'video/mp4', audio: 'audio/wav' };

  static typeOf(type) {
    return ArtifactContent.TYPES.includes(String(type)) ? String(type) : ArtifactContent.DEFAULT_TYPE;
  }

  static isMedia(type) {
    return Object.hasOwn(ArtifactContent.MEDIA_FALLBACK_MIME, type);
  }

  static normalize(type, { content, bytes, mime, language }) {
    if (ArtifactContent.isMedia(type)) return ArtifactContent._normalizeMedia(type, { content, bytes, mime, language });
    return {
      storedContent: content == null ? '' : String(content),
      storedLanguage: language ? String(language) : null,
    };
  }

  static _normalizeMedia(type, { content, bytes, mime, language }) {
    let storedContent = '';
    if (Buffer.isBuffer(bytes)) storedContent = bytes.toString('base64');
    else if (typeof content === 'string') storedContent = content;
    return { storedContent, storedLanguage: String(mime || language || ArtifactContent.MEDIA_FALLBACK_MIME[type]) };
  }
}

module.exports = ArtifactContent;
