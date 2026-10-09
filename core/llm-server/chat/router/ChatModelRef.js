class ChatModelRef {
  static LOCAL_PREFIX = 'local::';
  static SEPARATOR = '::';

  static isLocal(modelRef) {
    return typeof modelRef === 'string' && modelRef.startsWith(ChatModelRef.LOCAL_PREFIX);
  }

  static localName(modelRef) {
    return modelRef.slice(ChatModelRef.LOCAL_PREFIX.length);
  }

  static split(modelRef) {
    if (typeof modelRef !== 'string') return null;
    const sep = modelRef.indexOf(ChatModelRef.SEPARATOR);
    if (sep < 0) return null;
    return { providerId: modelRef.slice(0, sep), modelId: modelRef.slice(sep + ChatModelRef.SEPARATOR.length) };
  }

  static providerTag(modelRef) {
    if (!modelRef) return null;
    if (ChatModelRef.isLocal(modelRef)) return 'local';
    const parts = ChatModelRef.split(modelRef);
    return parts && parts.providerId ? parts.providerId : null;
  }
}

module.exports = ChatModelRef;
