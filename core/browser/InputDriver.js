class InputDriver {
  static BUTTONS = new Set(['left', 'right', 'middle']);
  static STAGE_DELAY_MS = 20;
  static DOUBLE_CLICK_GAP_MS = 40;

  static toDip(wc, x, y) {
    const zoom = InputDriver._zoomFactor(wc);
    return { x: Math.round(x * zoom), y: Math.round(y * zoom) };
  }

  static async trustedClick(wc, cssX, cssY, opts = {}) {
    const button = InputDriver._resolveButton(opts.button);
    const clicks = opts.clickCount === 2 ? 2 : 1;
    const point = InputDriver.toDip(wc, cssX, cssY);
    await InputDriver._hover(wc, point);
    for (let count = 1; count <= clicks; count++) {
      await InputDriver._pressAndRelease(wc, point, button, count);
      if (count < clicks) await InputDriver._sleep(InputDriver.DOUBLE_CLICK_GAP_MS);
    }
  }

  static _zoomFactor(wc) {
    try {
      return wc.getZoomFactor() || 1;
    } catch (_) {
      return 1;
    }
  }

  static _resolveButton(button) {
    return InputDriver.BUTTONS.has(button) ? button : 'left';
  }

  static async _hover(wc, { x, y }) {
    wc.sendInputEvent({ type: 'mouseMove', x, y });
    await InputDriver._sleep(InputDriver.STAGE_DELAY_MS);
  }

  static async _pressAndRelease(wc, { x, y }, button, clickCount) {
    wc.sendInputEvent({ type: 'mouseDown', x, y, button, clickCount });
    await InputDriver._sleep(InputDriver.STAGE_DELAY_MS);
    wc.sendInputEvent({ type: 'mouseUp', x, y, button, clickCount });
  }

  static _sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

module.exports = InputDriver;
