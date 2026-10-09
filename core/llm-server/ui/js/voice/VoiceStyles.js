export default class VoiceStyles {
  static ID = 'cm-voice-styles';

  static CSS = `
      .cm-mic.cm-mic-on { color: var(--accent, #7aa2ff); }
      .cm-mic[data-voice-state="listening"] svg,
      .cm-mic[data-voice-state="capturing"] svg { animation: cmVoicePulse 1.6s ease-in-out infinite; }
      .cm-mic[data-voice-state="speaking"] { color: #6fd68b; }
      .cm-mic[data-voice-state="transcribing"],
      .cm-mic[data-voice-state="waiting"] { opacity: .75; }
      @keyframes cmVoicePulse { 0%,100% { opacity:.55 } 50% { opacity:1 } }
      .cm-voice-pop {
        position: fixed; z-index: 10000; width: 320px; padding: 14px 16px;
        border-radius: 12px; background: var(--panel, #23252b);
        border: 1px solid var(--border, #3a3d45);
        box-shadow: 0 12px 40px rgba(0,0,0,.45);
        font-size: 13px; color: var(--fg, #e8e8ea);
      }
      .cm-voice-pop-title { font-weight: 600; margin-bottom: 6px; }
      .cm-voice-pop-body { opacity: .8; margin-bottom: 10px; line-height: 1.45; }
      .cm-voice-list { margin: 0 0 10px 18px; padding: 0; opacity: .9; }
      .cm-voice-list li { margin: 3px 0; }
      .cm-voice-install {
        width: 100%; padding: 8px 10px; border-radius: 8px; border: none;
        background: var(--accent, #4a6bdc); color: #fff; cursor: pointer; font-weight: 600;
      }
      .cm-voice-install[disabled] { opacity: .6; cursor: default; }
      .cm-voice-pop-note { margin-top: 8px; min-height: 16px; opacity: .8; }
      .cm-voice-mics {
        display: flex; flex-direction: column; gap: 2px;
        max-height: 180px; overflow-y: auto; margin-bottom: 4px;
      }
      .cm-voice-mic-row {
        display: flex; align-items: center; gap: 8px;
        padding: 6px 8px; border-radius: 8px; cursor: pointer;
      }
      .cm-voice-mic-row:hover { background: rgba(255,255,255,.06); }
      .cm-voice-mic-row input { accent-color: var(--accent, #7aa2ff); flex: none; margin: 0; }
      .cm-voice-mic-row span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .cm-voice-meter {
        height: 6px; border-radius: 3px; overflow: hidden;
        background: rgba(255,255,255,.08); margin: 10px 0 12px;
      }
      .cm-voice-meter-fill {
        height: 100%; width: 0%; background: var(--accent, #7aa2ff);
        transition: width 80ms linear;
      }
      .cm-voice-privacy { margin-top: 8px; }
      /* Live transcript strip: a mini user bubble pinned above the composer.
         Mirrors .cm-user-bubble colors so it clearly reads as "your words". */
      .cm-voice-transcript {
        display: flex; justify-content: flex-end;
        margin: 0 4px 8px; animation: cmVoiceStripIn 160ms ease-out;
      }
      .cm-voice-transcript-bubble {
        background: #25364f; border: 1px solid #34507a; color: #e7eefb;
        border-radius: 14px 14px 4px 14px; padding: 8px 12px;
        max-width: 80%; font-size: 13px; line-height: 1.45;
        overflow-wrap: anywhere;
      }
      .cm-voice-transcript-tag {
        display: flex; align-items: center; gap: 6px;
        font-size: 10px; font-weight: 600; text-transform: uppercase;
        letter-spacing: .06em; opacity: .65; margin-bottom: 2px;
      }
      .cm-voice-live-dot {
        width: 6px; height: 6px; border-radius: 50%;
        background: #e05a5a; display: none;
      }
      .cm-voice-transcript-live .cm-voice-live-dot {
        display: inline-block; animation: cmVoicePulse 1.2s ease-in-out infinite;
      }
      .cm-voice-transcript-live .cm-voice-transcript-text { opacity: .85; }
      .cm-voice-transcript-text:empty::before {
        content: 'Listening...'; opacity: .55; font-style: italic;
      }
      @keyframes cmVoiceStripIn {
        from { opacity: 0; transform: translateY(4px); }
        to { opacity: 1; transform: none; }
      }
      .cm-voice-sec {
        font-weight: 600; font-size: 12px; opacity: .7;
        margin: 4px 0 4px; text-transform: uppercase; letter-spacing: .04em;
      }
      .cm-voice-quality { margin-bottom: 10px; }
    `;

  static ensure(doc = document) {
    if (doc.getElementById(VoiceStyles.ID)) return;
    const style = doc.createElement('style');
    style.id = VoiceStyles.ID;
    style.textContent = VoiceStyles.CSS;
    doc.head.appendChild(style);
  }
}
