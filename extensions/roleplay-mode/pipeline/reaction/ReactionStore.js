class ReactionStore {
  static record(data, messageId, img, gen) {
    data.images = Object.assign({}, data.images || {}, {
      [messageId]: {
        b64: img.b64,
        mime: img.mime || 'image/png',
        gen: Object.assign({ prompt: gen.prompt, modelRef: data.baseModel || null, slot: null }, gen),
      },
    });
    data.lastShot = { b64: img.b64, mime: img.mime || 'image/png', sceneId: gen.sceneId, messageId };
  }

  static anchor(data, messageId, sig, oneOff) {
    if (sig && !oneOff) data.lastRender = { sig, messageId };
    else if (data.lastRender) delete data.lastRender;
  }

  static async publish(turn, data, img) {
    turn.emit('mode:image', { messageId: turn.messageId, b64: img.b64, mime: img.mime || 'image/png' });
    await turn.trySave(data);
  }
}

module.exports = ReactionStore;
