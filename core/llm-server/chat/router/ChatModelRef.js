class ChatModelRef {
  static LOCAL_PREFIX = 'local::';
  static SEPARATOR = '::';
  static PROFILE_PREFIX = 'profile::';

  static isLocal(modelRef) {
    return typeof modelRef === 'string' && modelRef.startsWith(ChatModelRef.LOCAL_PREFIX);
  }

  static isProfile(modelRef) {
    return typeof modelRef === 'string' && modelRef.startsWith(ChatModelRef.PROFILE_PREFIX);
  }

  static profileRef(profileId) {
    return ChatModelRef.PROFILE_PREFIX + profileId;
  }

  static profileId(modelRef) {
    return ChatModelRef.isProfile(modelRef) ? modelRef.slice(ChatModelRef.PROFILE_PREFIX.length) : '';
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
    if (!modelRef || ChatModelRef.isProfile(modelRef)) return null;
    if (ChatModelRef.isLocal(modelRef)) return 'local';
    const parts = ChatModelRef.split(modelRef);
    return parts && parts.providerId ? parts.providerId : null;
  }
}

module.exports = ChatModelRef;
