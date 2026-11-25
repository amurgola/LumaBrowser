export default class InputRelay {
  static META = { shift: 1, alt: 2, ctrl: 4096 };

  constructor(canvas, send) {
    this._canvas = canvas;
    this._send = send;
    this._touching = false;
  }

  attach() {
    const on = (type, handler, options) => this._canvas.addEventListener(type, handler, options);
    on('pointerdown', (event) => this._pointerDown(event));
    on('pointermove', (event) => { if (this._touching) this._touch('move', event); });
    on('pointerup', (event) => this._pointerUp(event));
    on('pointercancel', (event) => this._pointerUp(event));
    on('wheel', (event) => this._wheel(event), { passive: false });
    on('keydown', (event) => this._key(event, 'down'));
    on('keyup', (event) => this._key(event, 'up'));
    on('contextmenu', (event) => event.preventDefault());
  }

  _pointerDown(event) {
    if (event.button !== 0) return;
    this._canvas.focus();
    this._canvas.setPointerCapture(event.pointerId);
    this._touching = true;
    this._touch('down', event);
  }

  _pointerUp(event) {
    if (!this._touching) return;
    this._touching = false;
    this._touch('up', event);
  }

  _touch(action, event) {
    this._send({ type: 'touch', action, ...this.videoPoint(event) });
  }

  _wheel(event) {
    event.preventDefault();
    const notch = (pixels) => Math.max(-1, Math.min(1, -pixels / 100));
    this._send({ type: 'scroll', ...this.videoPoint(event), deltaX: notch(event.deltaX), deltaY: notch(event.deltaY) });
  }

  _key(event, action) {
    event.preventDefault();
    const message = InputRelay.keyMessage(event, action);
    if (message) this._send(message);
  }

  static keyMessage(event, action) {
    const printable = event.key.length === 1 && !event.ctrlKey && !event.altKey && !event.metaKey;
    if (printable) return action === 'down' ? { type: 'text', text: event.key } : null;
    const meta = (event.shiftKey ? InputRelay.META.shift : 0) | (event.altKey ? InputRelay.META.alt : 0) | (event.ctrlKey ? InputRelay.META.ctrl : 0);
    return { type: 'key', action, code: event.code, meta };
  }

  videoPoint(event) {
    return InputRelay.pointIn(this._canvas.getBoundingClientRect(), this._canvas, event);
  }

  static pointIn(box, picture, event) {
    const scale = Math.min(box.width / picture.width, box.height / picture.height);
    const left = box.left + (box.width - picture.width * scale) / 2;
    const top = box.top + (box.height - picture.height * scale) / 2;
    const clamp = (value, limit) => Math.max(0, Math.min(limit - 1, Math.round(value)));
    return { x: clamp((event.clientX - left) / scale, picture.width), y: clamp((event.clientY - top) / scale, picture.height) };
  }
}
