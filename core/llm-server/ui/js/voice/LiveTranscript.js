export default class LiveTranscript {
  constructor(getAnchor) {
    this._getAnchor = getAnchor;
  }

  show(text, final) {
    const strip = this._strip();
    if (!strip) return;
    strip.classList.toggle('cm-voice-transcript-live', !final);
    const textEl = strip.querySelector('.cm-voice-transcript-text');
    if (textEl) textEl.textContent = text || '';
  }

  hide() {
    document.querySelectorAll('.cm-voice-transcript').forEach((el) => el.remove());
  }

  _strip() {
    const anchor = this._getAnchor();
    const wrap = anchor && anchor.closest('.cm-composer-wrap');
    if (!wrap) return null;
    let strip = wrap.querySelector('.cm-voice-transcript');
    if (strip) return strip;
    strip = document.createElement('div');
    strip.className = 'cm-voice-transcript';
    strip.innerHTML = '<div class="cm-voice-transcript-bubble">'
      + '<span class="cm-voice-transcript-tag">You<span class="cm-voice-live-dot"></span></span>'
      + '<span class="cm-voice-transcript-text"></span></div>';
    wrap.insertBefore(strip, wrap.firstChild);
    return strip;
  }
}
