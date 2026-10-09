import Dom from '../../../../../llm-server/ui/js/dom/Dom.js';
import HtmlEscaper from '../../../../../llm-server/ui/js/format/HtmlEscaper.js';

export default class ShareArtifacts {
  constructor({ base, exportMode }) {
    this._base = base;
    this._exportMode = exportMode;
  }

  elements(artifacts) {
    const media = Dom.el('div', 'sv-media');
    const chips = Dom.el('div', 'cm-artifacts');
    for (const a of artifacts) {
      if (a.type === 'image') media.appendChild(this._image(a));
      else if (a.type === 'video') media.appendChild(this._video(a));
      else chips.appendChild(this._chip(a));
    }
    return [media, chips].filter((row) => row.childNodes.length);
  }

  url(id) {
    return this._base + '/artifact/' + encodeURIComponent(id);
  }

  _rawUrl(a) {
    return a.rawUrl || (this.url(a.id) + '/raw');
  }

  _image(a) {
    const img = Dom.el('img', 'sv-img');
    img.loading = this._exportMode ? 'eager' : 'lazy';
    img.alt = a.title || 'Image';
    img.src = this._rawUrl(a);
    return img;
  }

  _video(a) {
    const vid = document.createElement('video');
    vid.className = 'sv-img';
    vid.src = this._rawUrl(a);
    vid.controls = true;
    vid.loop = true;
    vid.muted = true;
    vid.playsInline = true;
    if (this._exportMode) vid.preload = 'metadata';
    return vid;
  }

  _chip(a) {
    const chip = Dom.el(this._exportMode ? 'span' : 'a', 'sv-chip');
    if (!this._exportMode) {
      chip.href = this.url(a.id);
      chip.target = '_blank';
      chip.rel = 'noopener';
    }
    chip.innerHTML = '<span>' + HtmlEscaper.escape(a.title || 'Artifact') + '</span>'
      + '<span class="sv-chip-type">' + HtmlEscaper.escape(a.type === 'live' ? 'interactive' : (a.type || 'html')) + '</span>';
    return chip;
  }
}
