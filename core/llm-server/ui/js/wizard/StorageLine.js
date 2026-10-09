import ByteFormatter from '../format/ByteFormatter.js';
import HtmlEscaper from '../format/HtmlEscaper.js';

export default class StorageLine {
  static HEADROOM = 1.1;

  static mount(host, needBytes, api) {
    if (!host || !api || !api.getStorageInfo) return;
    host.innerHTML = '<span class="wz-dim">Checking storage…</span>';
    api.getStorageInfo().then((result) => {
      if (result && result.success) StorageLine._paint(host, needBytes, api, result);
      else host.innerHTML = '';
    }).catch(() => { host.innerHTML = ''; });
  }

  static isTight(freeBytes, needBytes) {
    return freeBytes > 0 && needBytes > 0 && freeBytes < needBytes * StorageLine.HEADROOM;
  }

  static _paint(host, needBytes, api, info) {
    const esc = HtmlEscaper.escape;
    const cfg = (info && info.config) || {};
    const free = Number(info && info.freeBytes) || 0;
    const tight = StorageLine.isTight(free, needBytes);
    host.innerHTML = '<span class="wz-storage-path" title="' + esc(cfg.effectivePath || '') + '">'
      + esc(cfg.effectivePath || 'default location') + '</span>'
      + (free > 0 ? '<span class="wz-storage-free' + (tight ? ' tight' : '') + '">' + esc(ByteFormatter.gb(free)) + ' free</span>' : '')
      + '<button class="luma-btn link wz-storage-change" type="button">Change</button>'
      + (tight ? '<div class="luma-callout warn wz-storage-warn">This drive may not have room '
        + 'for the download. Pick another location, or free up space first.</div>' : '');
    host.querySelector('.wz-storage-change').addEventListener('click', () => StorageLine._change(host, needBytes, api));
  }

  static async _change(host, needBytes, api) {
    try {
      const picked = await api.pickModelsDir();
      if (!picked || !picked.success || picked.canceled || !picked.dir) return;
      await api.setModelsDir(picked.dir);
      StorageLine.mount(host, needBytes, api);
    } catch (_) {}
  }
}
