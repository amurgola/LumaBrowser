class EditRender {
  static modelRef(data) {
    return data && data.editModel ? data.editModel : undefined;
  }

  static async generate(chat, opts) {
    try { return await chat.generateImage(opts); } catch (_) { return null; }
  }

  static pause(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }
}

module.exports = EditRender;
