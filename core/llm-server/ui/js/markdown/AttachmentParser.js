export default class AttachmentParser {
  static DASH = String.fromCharCode(0x2014);

  static FILE_RE = /^\[Attached: ([^\]]*?)\]$/;

  static IMAGE_RE = /^\[Attached image: ([^\]]*?)\]$/;

  static FAILED_RE = /^\[Attachment failed: ([^\]]*?)\]$/;

  static BINARY_RE = new RegExp(AttachmentParser.DASH + '\\s*\\(binary, not embedded\\)\\s*$');

  static parse(content) {
    const src = String(content == null ? '' : content);
    const lines = src.split('\n');
    const attachments = [];
    let i = 0;
    while (i < lines.length) {
      const next = AttachmentParser._attachmentAt(lines, i);
      if (!next) break;
      attachments.push(next.attachment);
      i = next.end;
    }
    if (!attachments.length) return { text: src, attachments };
    return { text: AttachmentParser._typedText(lines.slice(i)), attachments };
  }

  static withText(content, text) {
    const lines = String(content == null ? '' : content).split('\n');
    let i = 0;
    while (i < lines.length) {
      const next = AttachmentParser._attachmentAt(lines, i);
      if (!next) break;
      i = next.end;
    }
    if (!i) return String(text);
    return lines.slice(0, i).concat(['', String(text)]).join('\n');
  }

  static splitLabel(label) {
    const bits = String(label).split('·').map((s) => s.trim()).filter(Boolean);
    return { name: bits[0] || 'file', meta: bits.slice(1).join(' · ') };
  }

  static _attachmentAt(lines, i) {
    const line = lines[i];
    let m;
    if ((m = line.match(AttachmentParser.FAILED_RE))) return { attachment: AttachmentParser._failed(m[1]), end: i + 1 };
    if ((m = line.match(AttachmentParser.IMAGE_RE))) return { attachment: AttachmentParser._marker('image', m[1]), end: i + 1 };
    if ((m = line.match(AttachmentParser.FILE_RE))) return AttachmentParser._fileAt(lines, i, m[1]);
    return null;
  }

  static _failed(label) {
    const bits = label.split(AttachmentParser.DASH);
    return {
      kind: 'failed',
      name: bits[0].trim() || 'file',
      meta: bits.slice(1).join(AttachmentParser.DASH).trim(),
      lang: '',
      content: '',
    };
  }

  static _marker(kind, label) {
    const { name, meta } = AttachmentParser.splitLabel(label);
    return { kind, name, meta, lang: '', content: '' };
  }

  static _fileAt(lines, i, label) {
    if (AttachmentParser.BINARY_RE.test(label)) {
      return { attachment: AttachmentParser._marker('binary', label.replace(AttachmentParser.BINARY_RE, '')), end: i + 1 };
    }
    const fence = lines[i + 1] != null && lines[i + 1].match(/^```([\w+#-]*)\s*$/);
    if (!fence) return null;
    let j = i + 2;
    while (j < lines.length && !/^```\s*$/.test(lines[j])) j++;
    if (j >= lines.length) return null;
    const { name, meta } = AttachmentParser.splitLabel(label);
    const content = lines.slice(i + 2, j).join('\n');
    return { attachment: { kind: 'file', name, meta, lang: fence[1] || '', content }, end: j + 1 };
  }

  static _typedText(rest) {
    const lines = rest.length && rest[0].trim() === '' ? rest.slice(1) : rest;
    return lines.join('\n');
  }
}
