import ChatIcons from '../ChatIcons.js';
import TurnData from './TurnData.js';
import Dom from '../../dom/Dom.js';
import HtmlEscaper from '../../format/HtmlEscaper.js';

export default class ArtifactChips {
  constructor(ctx) {
    this._ctx = ctx;
  }

  create(m) {
    const arts = TurnData.artifacts(m);
    if (!arts.length) return null;
    const box = Dom.el('div', 'cm-artifacts');
    const seen = new Set();
    for (const af of arts) {
      if (!af || seen.has(af.id)) continue;
      seen.add(af.id);
      box.appendChild(this._entry(af));
    }
    return box;
  }

  static signature(m) {
    return TurnData.artifacts(m).map((a) => (a && a.id) || '').join(',');
  }

  userImages(m) {
    if (m && Array.isArray(m.images) && m.images.length) {
      return m.images.map((im) => ArtifactChips.liveImageThumb(im.dataUrl, im.name));
    }
    return TurnData.imageArtifacts(m).map((af) => this._mediaThumb(af, 'image'));
  }

  static liveImageThumb(dataUrl, name) {
    const wrap = Dom.el('button', 'cm-art-thumb');
    wrap.title = (name || 'Image');
    wrap.setAttribute('aria-label', 'Attached image: ' + (name || 'image'));
    wrap.innerHTML = '<div class="cm-art-thumb-frame">'
      +   '<img class="cm-art-thumb-img" alt=""/>'
      + '</div>'
      + '<div class="cm-art-thumb-cap">'
      +   '<span class="cm-art-thumb-title">' + HtmlEscaper.escape(name || 'Image') + '</span>'
      + '</div>';
    const img = wrap.querySelector('.cm-art-thumb-img');
    if (img) img.src = dataUrl;
    return wrap;
  }

  _entry(af) {
    const t = af.type || '';
    if (t === 'live') return this._ctx.liveArtifacts.element(af);
    if (t === 'image' || t === 'video') return this._mediaThumb(af, t);
    if (t === 'audio') return this._audioPlayer(af);
    return this._chip(af);
  }

  _chip(af) {
    const chip = Dom.el('button', 'cm-artifact');
    chip.innerHTML = '<span class="cm-tc-ic">' + ChatIcons.doc + '</span>'
      + '<span class="cm-art-main"><b>' + HtmlEscaper.escape(af.title || 'Artifact') + '</b>'
      + '<span class="cm-tc-det">' + HtmlEscaper.escape(af.type || 'html') + ' · open in tab</span></span>';
    chip.title = 'Show this artifact in the side panel';
    chip.addEventListener('click', () => this._ctx.panel.open(af));
    return chip;
  }

  _mediaThumb(af, kind) {
    const fallback = kind === 'video' ? 'Video' : 'Image';
    const wrap = Dom.el('button', 'cm-art-thumb');
    wrap.title = (af.title || fallback) + '. Click to view larger';
    wrap.setAttribute('aria-label', 'Open ' + kind + ': ' + (af.title || kind));
    const media = kind === 'video'
      ? '<video class="cm-art-thumb-img" muted loop autoplay playsinline hidden></video>'
      : '<img class="cm-art-thumb-img" alt="" hidden/>';
    wrap.innerHTML = '<div class="cm-art-thumb-frame">'
      +   '<div class="cm-art-thumb-skel"></div>'
      +   media
      + '</div>'
      + '<div class="cm-art-thumb-cap">'
      +   '<span class="cm-art-thumb-title">' + HtmlEscaper.escape(af.title || fallback) + '</span>'
      +   '<span class="cm-art-thumb-hint">click to view larger</span>'
      + '</div>';
    wrap.addEventListener('click', () => this._ctx.panel.open(af));
    const paint = kind === 'video' ? (e) => ArtifactChips._paintVideo(wrap, e) : (e) => ArtifactChips._paintImage(wrap, e);
    this._whenLoaded(af, wrap, paint);
    return wrap;
  }

  _audioPlayer(af) {
    const wrap = Dom.el('div', 'cm-art-thumb cm-art-audio');
    wrap.title = af.title || 'Audio';
    wrap.innerHTML = '<button class="cm-art-thumb-cap" style="display:block;width:100%;text-align:left">'
      +   '<span class="cm-art-thumb-title">♪ ' + HtmlEscaper.escape(af.title || 'Audio') + '</span>'
      +   '<span class="cm-art-thumb-hint">click to open panel</span>'
      + '</button>'
      + '<audio controls style="width:100%;min-width:260px" hidden></audio>';
    wrap.querySelector('button').addEventListener('click', () => this._ctx.panel.open(af));
    this._whenLoaded(af, wrap, (entry) => {
      const audio = wrap.querySelector('audio');
      audio.src = entry.dataUrl;
      audio.hidden = false;
    });
    return wrap;
  }

  _whenLoaded(af, wrap, paint) {
    const cache = this._ctx.mediaCache;
    const cached = cache.peek(af.id);
    if (cached) { paint(cached); return; }
    cache.load(af.id).then((entry) => {
      if (entry && wrap.isConnected) paint(entry);
    });
  }

  static _paintImage(wrap, entry) {
    const img = wrap.querySelector('.cm-art-thumb-img');
    img.src = entry.dataUrl;
    img.hidden = false;
    ArtifactChips._removeSkeleton(wrap);
  }

  static _paintVideo(wrap, entry) {
    const vid = wrap.querySelector('video.cm-art-thumb-img');
    if (entry.mime && /^image\//i.test(entry.mime)) {
      const img = document.createElement('img');
      img.className = 'cm-art-thumb-img';
      img.src = entry.dataUrl;
      if (vid) vid.replaceWith(img);
    } else if (vid) {
      vid.src = entry.dataUrl;
      vid.hidden = false;
      try { const p = vid.play(); if (p && p.catch) p.catch(() => {}); } catch (_) {}
    }
    ArtifactChips._removeSkeleton(wrap);
  }

  static _removeSkeleton(wrap) {
    const skel = wrap.querySelector('.cm-art-thumb-skel');
    if (skel) skel.remove();
  }
}
