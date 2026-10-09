class ArtifactFile {
  static BINARY_TYPES = new Set(['image', 'video', 'audio']);
  static TEXT_TYPES = new Set(['html', 'svg', 'markdown', 'code']);
  static MIME_EXT = {
    'image/png': 'png', 'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif',
    'video/mp4': 'mp4', 'video/webm': 'webm', 'audio/wav': 'wav', 'audio/x-wav': 'wav', 'audio/mpeg': 'mp3',
  };
  static BINARY_FALLBACK_EXT = { image: 'png', video: 'mp4', audio: 'wav' };
  static TYPE_EXT = { html: 'html', svg: 'svg', markdown: 'md', live: 'html' };
  static CODE_LANG_EXT = {
    javascript: 'js', js: 'js', typescript: 'ts', ts: 'ts', python: 'py', py: 'py', gdscript: 'gd', gd: 'gd',
    json: 'json', css: 'css', html: 'html', shell: 'sh', bash: 'sh', powershell: 'ps1', csharp: 'cs', cs: 'cs',
    rust: 'rs', go: 'go', java: 'java', kotlin: 'kt', c: 'c', cpp: 'cpp', lua: 'lua', yaml: 'yml', toml: 'toml',
    sql: 'sql', markdown: 'md', xml: 'xml', glsl: 'glsl', gdshader: 'gdshader',
  };

  static extensionOf(art) {
    const type = String(art.type || '');
    const language = String(art.language || '').toLowerCase();
    if (ArtifactFile.BINARY_TYPES.has(type)) return ArtifactFile.MIME_EXT[language] || ArtifactFile.BINARY_FALLBACK_EXT[type];
    if (type === 'code') return ArtifactFile.CODE_LANG_EXT[language] || 'txt';
    return ArtifactFile.TYPE_EXT[type] || 'txt';
  }

  static payloadOf(art, store) {
    const type = String(art.type || '');
    if (ArtifactFile.BINARY_TYPES.has(type)) return ArtifactFile._binary(art, type);
    if (ArtifactFile.TEXT_TYPES.has(type)) return { bytes: Buffer.from(art.content == null ? '' : String(art.content), 'utf8'), kind: 'text' };
    if (type === 'live') return ArtifactFile._livePage(art, store);
    return { error: `artifact "${art.id}" has unsupported type "${type}".` };
  }

  static describeAll(list) {
    if (!list.length) return 'This conversation has no artifacts yet.';
    return 'Artifacts in this conversation (newest last):\n'
      + list.map((a) => `- ${a.id} · ${a.type}${a.language ? ` (${a.language})` : ''} · ${a.title || '(untitled)'}`).join('\n');
  }

  static _binary(art, type) {
    if (typeof art.content !== 'string' || !art.content) return { error: `artifact "${art.id}" has no stored ${type} data.` };
    return { bytes: Buffer.from(art.content, 'base64'), kind: type };
  }

  static _livePage(art, store) {
    let html = null;
    try { html = typeof store.renderedHtml === 'function' ? store.renderedHtml(art.id) : null; } catch (_) { html = null; }
    if (!html) return { error: `artifact "${art.id}" (live module) could not be rendered to a page.` };
    return { bytes: Buffer.from(html, 'utf8'), kind: 'text' };
  }
}

module.exports = ArtifactFile;
