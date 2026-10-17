export default class VoiceStyles {
  static ID = 'cm-voice-styles';

  static CSS = `
      .cm-mic.cm-mic-on { color: var(--accent); }
      .cm-mic[data-voice-state="listening"] svg,
      .cm-mic[data-voice-state="capturing"] svg { animation: cmVoicePulse 1.6s ease-in-out infinite; }
      .cm-mic[data-voice-state="speaking"] { color: var(--success); }
      .cm-mic[data-voice-state="transcribing"],
      .cm-mic[data-voice-state="waiting"] { opacity: .75; }
      @keyframes cmVoicePulse { 0%,100% { opacity:.55 } 50% { opacity:1 } }
      .cm-voice-pop {
        position: fixed; z-index: 10000; width: 320px; padding: var(--space-3) var(--space-4);
        box-sizing: border-box; overflow-y: auto;
        border-radius: var(--radius-xl); background: var(--surface-pop);
        box-shadow: var(--shadow-pop);
        font-size: var(--text-md); color: var(--text-primary);
      }
      .cm-voice-pop-title { font-weight: 600; margin-bottom: 6px; }
      .cm-voice-pop-body { color: var(--text-secondary); margin-bottom: 10px; line-height: 1.45; }
      .cm-voice-list { margin: 0 0 10px 18px; padding: 0; opacity: .9; }
      .cm-voice-list li { margin: 3px 0; }
      .cm-voice-install {
        width: 100%; padding: var(--space-2) var(--space-3); border-radius: var(--radius-md); border: none;
        background: var(--accent); color: var(--on-accent); cursor: pointer; font: inherit; font-weight: var(--weight-medium);
      }
      .cm-voice-install[disabled] { opacity: .6; cursor: default; }
      .cm-voice-pop-note { margin-top: 8px; min-height: 16px; color: var(--text-secondary); font-size: var(--text-sm); }
      .cm-voice-mics {
        display: flex; flex-direction: column; gap: 2px;
        max-height: 180px; overflow-y: auto; margin-bottom: 4px;
      }
      .cm-voice-mic-row {
        display: flex; align-items: center; gap: 8px;
        padding: 6px 8px; border-radius: var(--radius-md); cursor: pointer;
      }
      .cm-voice-mic-row:hover { background: var(--surface-hover); }
      .cm-voice-mic-row input { accent-color: var(--accent); flex: none; margin: 0; }
      .cm-voice-mic-row span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .cm-voice-meter {
        height: 6px; border-radius: 3px; overflow: hidden;
        background: var(--surface-active); margin: 10px 0 12px;
      }
      .cm-voice-meter-fill {
        height: 100%; width: 0%; background: var(--accent);
        transition: width 80ms linear;
      }
      .cm-voice-privacy { margin-top: 8px; }
      /* Live transcript strip: a mini user bubble pinned above the composer.
         Same fill as a sent user message so it reads as "your words". */
      .cm-voice-transcript {
        display: flex; justify-content: flex-end;
        margin: 0 4px 8px; animation: cmVoiceStripIn 160ms ease-out;
      }
      .cm-voice-transcript-bubble {
        background: var(--bg-surface-2); color: var(--text-primary);
        border-radius: var(--radius-lg); padding: 8px 12px;
        max-width: 80%; font-size: var(--text-md); line-height: var(--leading);
        overflow-wrap: anywhere;
      }
      .cm-voice-transcript-tag {
        display: flex; align-items: center; gap: 6px;
        font-size: var(--text-xs); font-weight: var(--weight-medium);
        color: var(--text-secondary); margin-bottom: 2px;
      }
      .cm-voice-live-dot {
        width: 6px; height: 6px; border-radius: 50%;
        background: var(--danger); display: none;
      }
      .cm-voice-transcript-live .cm-voice-live-dot {
        display: inline-block; animation: cmVoicePulse 1.2s ease-in-out infinite;
      }
      .cm-voice-transcript-live .cm-voice-transcript-text { opacity: .85; }
      .cm-voice-transcript-text:empty::before {
        content: 'Listening...'; opacity: .55; font-style: italic;
      }
      @media (prefers-reduced-motion: reduce) { .cm-voice-transcript, .cm-mic svg, .cm-voice-live-dot { animation: none !important; } }
      @keyframes cmVoiceStripIn {
        from { opacity: 0; transform: translateY(4px); }
        to { opacity: 1; transform: none; }
      }
      .cm-voice-sec {
        font-weight: var(--weight-medium); font-size: var(--text-sm); color: var(--text-secondary);
        margin: 4px 0 4px;
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
