class PermissionKinds {
  static MEDIA_KINDS = ['camera', 'microphone'];
  static APP_ORIGIN = 'file://';

  static originOf(url) {
    if (!url || typeof url !== 'string') return null;
    if (url.startsWith(PermissionKinds.APP_ORIGIN)) return PermissionKinds.APP_ORIGIN;
    try {
      const u = new URL(url);
      if (u.protocol === 'file:') return PermissionKinds.APP_ORIGIN;
      return u.origin && u.origin !== 'null' ? u.origin : null;
    } catch (_) {
      return null;
    }
  }

  static kindsOf(permission, details) {
    if (permission === 'camera') return ['camera'];
    if (permission === 'microphone') return ['microphone'];
    if (permission !== 'media') return null;
    return PermissionKinds._kindsFromMediaTypes(details && details.mediaTypes);
  }

  static kindsOfCheck(mediaType) {
    if (mediaType === 'video') return ['camera'];
    if (mediaType === 'audio') return ['microphone'];
    return PermissionKinds.MEDIA_KINDS.slice();
  }

  static describe(kinds) {
    const hasCamera = kinds.includes('camera');
    const hasMicrophone = kinds.includes('microphone');
    if (hasCamera && hasMicrophone) return 'use your camera and microphone';
    if (hasCamera) return 'use your camera';
    return 'use your microphone';
  }

  static hostOf(origin) {
    try { return new URL(origin).host || origin; } catch (_) { return origin; }
  }

  static _kindsFromMediaTypes(types) {
    if (!Array.isArray(types) || !types.length) return PermissionKinds.MEDIA_KINDS.slice();
    const out = [];
    if (types.includes('video')) out.push('camera');
    if (types.includes('audio')) out.push('microphone');
    return out.length ? out : PermissionKinds.MEDIA_KINDS.slice();
  }
}

module.exports = PermissionKinds;
