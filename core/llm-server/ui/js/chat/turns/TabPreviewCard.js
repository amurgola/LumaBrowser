import ChatIcons from '../ChatIcons.js';
import Dom from '../../dom/Dom.js';

export default class TabPreviewCard {
  constructor(ctx) {
    this._ctx = ctx;
  }

  create(pv, live) {
    const card = Dom.el('div', 'cm-tabpreview' + (live ? ' live' : ''));
    card.innerHTML = '<div class="cm-tp-head">'
      + '<span class="cm-tp-ic">' + (live ? '<span class="cm-tp-pulse"></span>' : ChatIcons.tools) + '</span>'
      + '<span class="cm-tp-label">' + (live ? 'Working in a browser tab' : 'Browser tab (finished)') + '</span>'
      + (live ? '<button type="button" class="cm-tp-open">Open tab</button>' : '')
      + '</div>'
      + '<div class="cm-tp-slot"></div>';
    const slot = card.querySelector('.cm-tp-slot');
    if (live) this._fillLive(card, slot, pv);
    else if (pv && pv.frame && pv.frame.dataUrl) slot.appendChild(TabPreviewCard._frameImg(pv.frame.dataUrl, 'Final state of the browser tab the agent used'));
    else card.classList.add('empty');
    return card;
  }

  applyFrame(payload) {
    const m = this._ctx.state.streamMsg;
    if (!m || !m._preview || !payload || !payload.dataUrl) return;
    if (m._preview.tabId !== payload.tabId) return;
    m._preview.frame = { dataUrl: payload.dataUrl, width: payload.width, height: payload.height };
    const slot = this._ctx.root && this._ctx.root.querySelector('.cm-tabpreview.live .cm-tp-slot');
    if (!slot) return;
    let img = slot.querySelector('.cm-tp-frame');
    if (!img) {
      img = TabPreviewCard._frameImg(null, '');
      slot.appendChild(img);
    }
    img.src = payload.dataUrl;
  }

  _fillLive(card, slot, pv) {
    this._ctx.previewSlot.bind(slot);
    if (pv && pv.frame && pv.frame.dataUrl) slot.appendChild(TabPreviewCard._frameImg(pv.frame.dataUrl, ''));
    const open = card.querySelector('.cm-tp-open');
    if (!open) return;
    open.addEventListener('click', () => {
      const api = this._ctx.api;
      if (api && api.tabPreview) { try { api.tabPreview.focus(); } catch (_) {} }
    });
  }

  static _frameImg(src, alt) {
    const img = Dom.el('img', 'cm-tp-frame');
    img.alt = alt;
    if (src) img.src = src;
    return img;
  }
}
