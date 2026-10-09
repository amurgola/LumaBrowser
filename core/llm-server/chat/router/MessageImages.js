class MessageImages {
  static DEFAULT_MIME = 'image/png';

  static inject(messages, images) {
    return MessageImages._rewriteLastUser(messages, (message) => ({
      ...message,
      content: MessageImages._parts(MessageImages._text(message), images),
    }));
  }

  static noteNotVisible(messages, count) {
    const note = MessageImages._notVisibleNote(count || 0);
    return MessageImages._rewriteLastUser(messages, (message) => ({
      ...message,
      content: MessageImages._text(message) + note,
    }));
  }

  static imagesOf(attachments) {
    return Array.isArray(attachments) ? attachments.filter((a) => a && a.kind === 'image' && a.base64) : [];
  }

  static _rewriteLastUser(messages, rewrite) {
    const out = messages.slice();
    for (let i = out.length - 1; i >= 0; i--) {
      if (!out[i] || out[i].role !== 'user') continue;
      out[i] = rewrite(out[i]);
      break;
    }
    return out;
  }

  static _text(message) {
    return typeof message.content === 'string' ? message.content : '';
  }

  static _parts(text, images) {
    const parts = [];
    if (text) parts.push({ type: 'text', text });
    for (const image of images) {
      const mime = image.mime || MessageImages.DEFAULT_MIME;
      parts.push({ type: 'image_url', image_url: { url: `data:${mime};base64,${image.base64}` } });
    }
    return parts;
  }

  static _notVisibleNote(n) {
    const noun = `${n} image${n === 1 ? '' : 's'} ${n === 1 ? 'was' : 'were'}`;
    return `\n\n[System note: ${noun} attached to this message, but the model currently loaded cannot see images (no vision projector is active), so the picture content is NOT available to you; only the filename above. Do not pretend to have seen it, do not guess what it depicts, and do not use the screenshot or any browser tool to try to open the local attachment (it isn't reachable). Tell the user plainly that this model can't view images, and ask them to describe it, paste the text, or switch to a vision-capable model.]`;
  }
}

module.exports = MessageImages;
