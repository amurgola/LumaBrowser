import ByteFormatter from '../../format/ByteFormatter.js';
import AttachmentParser from '../../markdown/AttachmentParser.js';

export default class UserMessageComposer {
  static compose(userText, attachments) {
    if (!attachments || attachments.length === 0) return userText;
    const parts = [];
    for (const f of attachments) {
      if (f) UserMessageComposer._appendAttachment(parts, f);
    }
    parts.push('');
    parts.push(userText);
    return parts.join('\n');
  }

  static images(attachments) {
    return (attachments || [])
      .filter((f) => f && f.kind === 'image' && f.base64 && !f.error)
      .map((f) => ({ name: f.name, mime: f.mime || 'image/png', base64: f.base64, ...(f.region ? { region: UserMessageComposer._wireRegion(f.region) } : {}) }));
  }

  static regions(attachments) {
    return (attachments || [])
      .filter((f) => f && f.kind === 'region' && f.artifactId && f.mask)
      .map((f) => ({ kind: 'region', artifactId: f.artifactId, title: f.title || '', ...UserMessageComposer._wireRegion(f) }));
  }

  static markedAreas(attachments) {
    const out = [];
    for (const f of (attachments || [])) {
      if (!f) continue;
      if (f.kind === 'region' && f.mask) out.push({ artifactId: f.artifactId, title: f.title || '', note: f.note || '', coverage: f.coverage, preview: f.preview || null });
      else if (f.kind === 'image' && f.region && !f.error) out.push({ title: f.name || 'image', note: f.region.note || '', coverage: f.region.coverage, preview: f.region.preview || null });
    }
    return out;
  }

  static _wireRegion({ mask, note, coverage, width, height }) {
    return { mask, note: note || '', coverage, width, height };
  }

  static _appendAttachment(parts, f) {
    const dash = AttachmentParser.DASH;
    const sz = f.size ? ' · ' + ByteFormatter.bytes(f.size, { zero: '' }) : '';
    if (f.error) {
      parts.push('[Attachment failed: ' + (f.name || 'file') + ' ' + dash + ' ' + f.error + ']');
    } else if ((f.kind === 'text' || f.kind === 'pdf') && typeof f.text === 'string') {
      UserMessageComposer._appendText(parts, f, sz);
    } else if (f.kind === 'image' && f.base64) {
      parts.push('[Attached image: ' + (f.name || 'image') + sz + ']');
      if (f.region) parts.push(UserMessageComposer._areaMarker(f.name || 'image', f.region.note));
    } else if (f.kind === 'region') {
      parts.push(UserMessageComposer._areaMarker(f.title || 'image', f.note));
    } else {
      parts.push('[Attached: ' + (f.name || 'file') + sz + ' ' + dash + ' (binary, not embedded)]');
    }
  }

  static _areaMarker(title, note) {
    const text = String(note || '').replace(/\s+/g, ' ').trim();
    return '[Marked area on ' + title + (text ? ' ' + AttachmentParser.DASH + ' ' + text : '') + ']';
  }

  static _appendText(parts, f, sz) {
    const lang = (f.language || '').toLowerCase().replace(/[^a-z0-9+#-]/g, '');
    const note = f.truncated ? sz + ' · truncated' : sz;
    const src = f.source ? ' · ' + f.source : '';
    parts.push('[Attached: ' + (f.name || 'file') + src + note + ']');
    parts.push('```' + lang);
    parts.push(f.text);
    parts.push('```');
  }
}
