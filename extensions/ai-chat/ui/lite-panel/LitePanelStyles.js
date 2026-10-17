export default class LitePanelStyles {
  static STYLE_ID = 'ai-lite-panel-style';

  static RULES = [
    '.ai-chat-header-left { display: flex; align-items: center; gap: var(--space-2); min-width: 0; }',
    '.ai-chat-model { max-width: 200px; height: 28px; padding: 0 var(--space-2); border-radius: var(--radius-md); border: 1px solid var(--border-soft); background: var(--bg-surface-2); color: var(--text-primary); font: inherit; font-size: var(--text-sm); color-scheme: dark; cursor: pointer; transition: border-color var(--dur-fast) var(--ease); }',
    '.ai-chat-model:hover:not(:disabled) { border-color: var(--border-strong); }',
    '.ai-chat-model:focus-visible { outline: none; border-color: var(--accent); box-shadow: var(--focus-ring); }',
    '.ai-chat-model:disabled { opacity: .6; cursor: default; }',
    '.ai-chat-model option { background: var(--surface-pop); color: var(--text-primary); }',
    '#aiChatTools { height: 28px; padding: 0 var(--space-3); font-size: var(--text-sm); }',
    '.ai-chat-tools-wrap { position: relative; }',
    '.ai-chat-tools-pop { position: absolute; top: calc(100% + 6px); left: 0; z-index: 5; width: 280px; max-height: 320px; overflow: auto; padding: var(--space-2) var(--space-3); border-radius: var(--radius-xl); background: var(--surface-pop); box-shadow: var(--shadow-pop); display: none; }',
    '.ai-chat-tools-pop.open { display: block; }',
    '.ai-chat-tools-group { font-size: var(--text-xs); font-weight: var(--weight-medium); color: var(--text-secondary); margin: var(--space-2) 0 2px; }',
    '.ai-chat-tools-group:first-child { margin-top: 0; }',
    '.ai-chat-tools-pop .luma-check { display: flex; align-items: center; gap: var(--space-2); font-size: var(--text-sm); padding: 3px 0; color: var(--text-primary); cursor: pointer; }',
    '.ai-chat-tools-note { font-size: var(--text-sm); color: var(--text-muted); }',
    '.ai-lite-card { display: flex; flex-direction: column; gap: var(--space-1); margin: var(--space-1) 0; padding: var(--space-3); border-radius: var(--radius-lg); background: var(--bg-surface-2); }',
    '.ai-lite-card b { font-size: var(--text-md); font-weight: var(--weight-semibold); color: var(--text-primary); }',
    '.ai-lite-card-det { font-size: var(--text-sm); color: var(--text-secondary); word-break: break-word; }',
    '.ai-lite-card-actions { display: flex; flex-wrap: wrap; gap: var(--space-2); margin-top: var(--space-2); }',
    '.ai-lite-card-actions .luma-btn { height: 28px; padding: 0 var(--space-3); font-size: var(--text-sm); }',
    '.ai-lite-notice { margin: 0 0 var(--space-3); padding: var(--space-3); border-radius: var(--radius-lg); border: 1px solid var(--border-soft); background: var(--bg-surface-2); color: var(--text-secondary); font-size: var(--text-sm); display: flex; flex-direction: column; gap: var(--space-2); }',
    '.ai-lite-notice .luma-btn { align-self: flex-start; height: 28px; padding: 0 var(--space-3); font-size: var(--text-sm); }',
  ];

  static install(doc = document) {
    if (!doc || doc.getElementById(LitePanelStyles.STYLE_ID)) return;
    const style = doc.createElement('style');
    style.id = LitePanelStyles.STYLE_ID;
    style.textContent = LitePanelStyles.RULES.join('\n');
    doc.head.appendChild(style);
  }
}
