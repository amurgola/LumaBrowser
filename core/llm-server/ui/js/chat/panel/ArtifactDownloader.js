export default class ArtifactDownloader {
  static CODE_EXT = {
    js: 'js', javascript: 'js', ts: 'ts', typescript: 'ts', py: 'py', python: 'py',
    rb: 'rb', go: 'go', rs: 'rs', java: 'java', c: 'c', cpp: 'cpp', cs: 'cs',
    sh: 'sh', bash: 'sh', json: 'json', yaml: 'yaml', yml: 'yaml', sql: 'sql',
    css: 'css', html: 'html',
  };

  static MIME_EXT = {
    'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif',
    'video/mp4': 'mp4', 'video/webm': 'webm', 'audio/wav': 'wav', 'audio/x-wav': 'wav', 'audio/mpeg': 'mp3',
  };

  static MEDIA_FALLBACK_MIME = { image: 'image/png', video: 'video/mp4', audio: 'audio/wav' };

  static async download(api, panel) {
    if (!panel || !panel.id) return;
    if (ArtifactDownloader.MEDIA_FALLBACK_MIME[panel.type]) {
      await ArtifactDownloader._downloadMedia(api, panel);
      return;
    }
    await ArtifactDownloader._downloadText(api, panel);
  }

  static extFromMime(mime) {
    return ArtifactDownloader.MIME_EXT[String(mime).toLowerCase()] || 'bin';
  }

  static extForArtifact(a) {
    if (a.type === 'markdown') return 'md';
    if (a.type === 'svg') return 'svg';
    if (a.type === 'code') return ArtifactDownloader.CODE_EXT[(a.language || '').toLowerCase()] || 'txt';
    return 'html';
  }

  static safeName(title, fallback) {
    return String(title || fallback).replace(/[^\w.-]+/g, '_').slice(0, 60) || fallback;
  }

  static base64ToBlob(b64, mime) {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  }

  static async _downloadMedia(api, p) {
    const fallbackMime = ArtifactDownloader.MEDIA_FALLBACK_MIME[p.type];
    let b64 = p.b64;
    let mime = p.mime;
    if (!b64 && api.artifact && api.artifact.get) {
      try {
        const r = await api.artifact.get(p.id);
        if (r && r.success && r.artifact) {
          b64 = r.artifact.content || '';
          mime = r.artifact.language || fallbackMime;
        }
      } catch (_) {}
    }
    if (!b64) return;
    const type = mime || fallbackMime;
    const name = ArtifactDownloader.safeName(p.title || p.type, p.type) + '.' + ArtifactDownloader.extFromMime(type);
    ArtifactDownloader._save(ArtifactDownloader.base64ToBlob(b64, type), name);
  }

  static async _downloadText(api, p) {
    if (!api.artifact || !api.artifact.get) return;
    let r;
    try { r = await api.artifact.get(p.id); } catch (_) { return; }
    if (!r || !r.success || !r.artifact) return;
    const a = r.artifact;
    const name = ArtifactDownloader.safeName(a.title, 'artifact') + '.' + ArtifactDownloader.extForArtifact(a);
    ArtifactDownloader._save(new Blob([a.content || ''], { type: 'text/plain;charset=utf-8' }), name);
  }

  static _save(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }
}
