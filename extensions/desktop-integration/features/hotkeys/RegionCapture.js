class RegionCapture {
  constructor({ electron, win = null, overlay, platform = process.platform }) {
    this._electron = electron;
    this._win = win;
    this._overlay = overlay;
    this._platform = platform;
  }

  get busy() {
    return this._overlay.active;
  }

  cancel() {
    this._overlay.cancel();
  }

  async capture() {
    if (this._overlay.active) return { success: false, error: 'A region pick is already open', code: 'BUSY' };
    let frozen;
    try {
      frozen = await this._freeze();
    } catch (err) {
      return { success: false, error: `Screen capture failed: ${(err && err.message) || err}`, code: 'FAILED' };
    }
    const displays = this._electron.screen.getAllDisplays();
    const picked = await this._overlay.pick(displays);
    if (!picked) return { success: false, error: 'Canceled', code: 'CANCELED' };
    const display = displays.find((d) => d.id === picked.displayId);
    try {
      const image = frozen.crop(display, picked.rect);
      if (!image || (typeof image.isEmpty === 'function' && image.isEmpty())) throw new Error('empty image');
      const size = image.getSize();
      return { success: true, png: image.toPNG(), width: size.width, height: size.height };
    } catch (err) {
      return { success: false, error: `Cropping the capture failed: ${(err && err.message) || err}`, code: 'FAILED' };
    }
  }

  async captureRect(rect) {
    try {
      const frozen = await this._freeze();
      const display = this._electron.screen.getDisplayMatching(rect);
      const local = { x: rect.x - display.bounds.x, y: rect.y - display.bounds.y, width: rect.width, height: rect.height };
      const image = frozen.crop(display, local);
      if (!image || (typeof image.isEmpty === 'function' && image.isEmpty())) throw new Error('empty image');
      const size = image.getSize();
      return { success: true, png: image.toPNG(), width: size.width, height: size.height };
    } catch (err) {
      return { success: false, error: `Screen capture failed: ${(err && err.message) || err}`, code: 'FAILED' };
    }
  }

  async _freeze() {
    if (this._platform === 'win32' && this._win) return this._freezeWin32();
    return this._freezeCapturer();
  }

  _freezeWin32() {
    const { nativeImage, screen } = this._electron;
    const vs = this._win.virtualScreen();
    const shot = this._win.captureBGRA({ rect: vs });
    const image = nativeImage.createFromBitmap(shot.bgra, { width: shot.width, height: shot.height });
    return {
      crop: (display, rect) => {
        const global = { x: display.bounds.x + rect.x, y: display.bounds.y + rect.y, width: rect.width, height: rect.height };
        const phys = RegionCapture.toPhysical(screen, display, global);
        return image.crop(RegionCapture.clamp({ x: phys.x - vs.x, y: phys.y - vs.y, width: phys.width, height: phys.height }, shot.width, shot.height));
      },
    };
  }

  async _freezeCapturer() {
    const { desktopCapturer, screen } = this._electron;
    if (!desktopCapturer || typeof desktopCapturer.getSources !== 'function') throw new Error('desktopCapturer is not available');
    const displays = screen.getAllDisplays();
    const width = Math.max(...displays.map((d) => Math.round(d.bounds.width * (d.scaleFactor || 1))));
    const height = Math.max(...displays.map((d) => Math.round(d.bounds.height * (d.scaleFactor || 1))));
    const sources = await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width, height } });
    return {
      crop: (display, rect) => {
        const source = sources.find((s) => String(s.display_id) === String(display.id)) || (sources.length === 1 ? sources[0] : null);
        if (!source) throw new Error('no capture for that display');
        const img = source.thumbnail;
        const size = img.getSize();
        const sx = size.width / display.bounds.width;
        const sy = size.height / display.bounds.height;
        const scaled = { x: Math.round(rect.x * sx), y: Math.round(rect.y * sy), width: Math.round(rect.width * sx), height: Math.round(rect.height * sy) };
        return img.crop(RegionCapture.clamp(scaled, size.width, size.height));
      },
    };
  }

  static toPhysical(screen, display, rect) {
    if (screen && typeof screen.dipToScreenRect === 'function') {
      try { return screen.dipToScreenRect(null, rect); } catch (_) {}
    }
    const s = display.scaleFactor || 1;
    return { x: Math.round(rect.x * s), y: Math.round(rect.y * s), width: Math.round(rect.width * s), height: Math.round(rect.height * s) };
  }

  static clamp(r, maxW, maxH) {
    const x = Math.max(0, Math.min(Math.round(r.x), maxW - 1));
    const y = Math.max(0, Math.min(Math.round(r.y), maxH - 1));
    const width = Math.max(1, Math.min(Math.round(r.width), maxW - x));
    const height = Math.max(1, Math.min(Math.round(r.height), maxH - y));
    return { x, y, width, height };
  }
}

module.exports = RegionCapture;
