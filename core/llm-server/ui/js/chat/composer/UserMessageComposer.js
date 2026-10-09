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
      .map((f) => ({ name: f.name, mime: f.mime || 'image/png', base64: f.base64 }));
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
    } else {
      parts.push('[Attached: ' + (f.name || 'file') + sz + ' ' + dash + ' (binary, not embedded)]');
    }
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
