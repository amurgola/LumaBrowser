export default class LitePanelStyles {
  static STYLE_ID = 'ai-lite-panel-style';

  static RULES = [
    '#aiChatToggle { position: relative; }',
    '#aiChatToggle .ai-chat-state-dot { position: absolute; top: 5px; right: 5px; width: 7px; height: 7px; }',
    '.ai-chat-header-left { display: flex; align-items: center; gap: 8px; min-width: 0; }',
    '.ai-chat-model { max-width: 190px; font-size: 11px; padding: 2px 6px; border-radius: var(--radius-sm, 4px); border: 1px solid var(--border); background: var(--surface-input, var(--bg-card)); color: var(--text); }',
    '.ai-chat-model:disabled { opacity: .6; }',
    '.ai-chat-model { cursor: pointer; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 80px; text-align: left; }',
    '.ai-chat-model::after { content: " ▾"; }',
    '.ai-chat-model-pop { position: fixed; z-index: 1000; box-sizing: border-box; display: flex; flex-direction: column; padding: 8px; gap: 6px; border: 1px solid var(--border); border-radius: 8px; background: var(--surface-pop, #141b2c); color: var(--text); box-shadow: 0 8px 24px rgba(0,0,0,.4); }',
    '.ai-chat-model-pop[hidden] { display: none; }',
    '.ai-chat-model-search { box-sizing: border-box; width: 100%; flex-shrink: 0; padding: 7px 9px; border: 1px solid var(--border); border-radius: 4px; background: var(--surface-input, #101622); color: var(--text); font: inherit; }',
    '.ai-chat-model-search:focus { outline: 2px solid var(--accent, #80bfff); outline-offset: -1px; }',
    '.ai-chat-model-options { overflow-y: auto; min-height: 0; }',
    '.ai-chat-model-option { padding: 7px 9px; border-radius: 4px; cursor: pointer; overflow-wrap: anywhere; font-size: 12px; }',
    '.ai-chat-model-option:hover, .ai-chat-model-option.active { background: var(--accent-soft, #26364c); }',
    '.ai-chat-model-option[aria-selected="true"] { color: var(--accent, #80bfff); font-weight: 600; }',
    '.ai-chat-model-count { flex-shrink: 0; padding: 2px 9px; color: var(--text-dim); font-size: 11px; }',
    '.ai-chat-tools-wrap { position: relative; }',
    '.ai-chat-tools-pop { position: absolute; top: calc(100% + 6px); left: 0; z-index: 5; width: 280px; max-height: 320px; overflow: auto; padding: 8px 10px; border-radius: var(--radius-md, 8px); border: 1px solid var(--border-strong, var(--border)); background: var(--surface-pop, var(--bg-card)); box-shadow: var(--shadow-md, 0 8px 24px rgba(0,0,0,.4)); display: none; }',
    '.ai-chat-tools-pop.open { display: block; }',
    '.ai-chat-tools-group { font-size: 11px; font-weight: 600; color: var(--text-dim); margin: 6px 0 2px; }',
    '.ai-chat-tools-pop .luma-check { display: flex; align-items: center; gap: 6px; font-size: 12px; padding: 2px 0; color: var(--text); cursor: pointer; }',
    '.ai-chat-tools-note { font-size: 11px; color: var(--text-muted); }',
    '.ai-lite-card { display: flex; flex-direction: column; gap: 6px; margin: 6px 0; padding: 8px 10px; border-radius: var(--radius-md, 8px); border: 1px solid var(--accent); background: var(--accent-soft, transparent); }',
    '.ai-lite-card b { font-size: 12px; color: var(--text); }',
    '.ai-lite-card-det { font-size: 12px; color: var(--text-dim); word-break: break-word; }',
    '.ai-lite-card-actions { display: flex; flex-wrap: wrap; gap: 6px; }',
    '.ai-lite-card-actions .luma-btn { font-size: 11px; padding: 3px 9px; }',
    '.ai-lite-notice { margin: 8px 0; padding: 10px 12px; border-radius: var(--radius-md, 8px); border: 1px solid var(--border); background: var(--bg-card); color: var(--text-dim); font-size: 12px; display: flex; flex-direction: column; gap: 8px; }',
    '.ai-lite-notice .luma-btn { align-self: flex-start; font-size: 11px; padding: 3px 9px; }',
  ];

  static install(doc = document) {
    if (!doc || doc.getElementById(LitePanelStyles.STYLE_ID)) return;
    const style = doc.createElement('style');
    style.id = LitePanelStyles.STYLE_ID;
    style.textContent = LitePanelStyles.RULES.join('\n');
    doc.head.appendChild(style);
  }
}
