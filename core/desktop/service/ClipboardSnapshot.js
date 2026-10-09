class ClipboardSnapshot {
  static take(clipboard) {
    try {
      return {
        text: clipboard.readText(),
        html: ClipboardSnapshot._readOptional(clipboard, 'readHTML', ''),
        rtf: ClipboardSnapshot._readOptional(clipboard, 'readRTF', ''),
        image: ClipboardSnapshot._readImage(clipboard),
      };
    } catch (_) {
      return null;
    }
  }

  static restore(clipboard, snapshot) {
    const data = ClipboardSnapshot._restorable(snapshot);
    if (Object.keys(data).length) clipboard.write(data);
    else clipboard.clear();
  }

  static _readOptional(clipboard, method, fallback) {
    return typeof clipboard[method] === 'function' ? clipboard[method]() : fallback;
  }

  static _readImage(clipboard) {
    if (typeof clipboard.readImage !== 'function') return null;
    const image = clipboard.readImage();
    return image && typeof image.isEmpty === 'function' && !image.isEmpty() ? image : null;
  }

  static _restorable(snapshot) {
    const data = {};
    for (const key of ['text', 'html', 'rtf', 'image']) {
      if (snapshot[key]) data[key] = snapshot[key];
    }
    return data;
  }
}

module.exports = ClipboardSnapshot;
