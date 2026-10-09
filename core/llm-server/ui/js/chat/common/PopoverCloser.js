export default class PopoverCloser {
  constructor(ctx) {
    this._ctx = ctx;
    this._closer = null;
  }

  arm() {
    if (this._closer) document.removeEventListener('click', this._closer);
    const fn = () => {
      if (this._closer === fn) this._closer = null;
      this.closeAll();
    };
    this._closer = fn;
    setTimeout(() => {
      if (this._closer === fn) document.addEventListener('click', fn, { once: true });
    }, 0);
  }

  closeAll() {
    if (this._closer) {
      document.removeEventListener('click', this._closer);
      this._closer = null;
    }
    const root = this._ctx.root;
    if (root) root.querySelectorAll('.cm-model-pop, .cm-menu').forEach((e) => e.remove());
    document.querySelectorAll('.cm-menu').forEach((e) => e.remove());
  }

  showMenuAt(menu, e, reserve) {
    document.body.appendChild(menu);
    menu.style.left = Math.min(e.clientX, window.innerWidth - reserve) + 'px';
    menu.style.top = Math.min(e.clientY, window.innerHeight - reserve) + 'px';
    this.arm();
  }
}
