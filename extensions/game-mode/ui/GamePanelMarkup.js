import HtmlEscaper from '../../../core/llm-server/ui/js/format/HtmlEscaper.js';

export default class GamePanelMarkup {
  static STATUS_LABEL = { editing: 'Building', error: 'Needs fixing' };

  static ASSET_LABEL = { pending: 'Generating…', done: 'Generated', placeholder: 'Placeholder', error: 'Failed' };

  static hasContent(game) {
    return !!(game && ((game.files && game.files.length) || (game.assets && game.assets.length) || game.playable));
  }

  static isAiGame(game) {
    return !!(game && game.gameKind === 'ai');
  }

  static fileDot(file) {
    if (file.phase === 'writing') return { cls: 'writing', title: 'Writing…' };
    return file.ok ? { cls: 'ok', title: 'Valid' } : { cls: 'bad', title: 'Has problems' };
  }

  static assetDot(asset) {
    const s = asset.status;
    const cls = s === 'done' ? 'ok' : s === 'error' ? 'bad' : s === 'pending' ? 'writing' : 'queued';
    return { cls, title: GamePanelMarkup.ASSET_LABEL[s] || s };
  }

  static html(game, collapsed) {
    const dis = game.playable ? '' : ' disabled';
    return `
      ${GamePanelMarkup._head(game, collapsed)}
      <div class="gm-list">${GamePanelMarkup._rows(game)}</div>
      <div class="gm-foot">
        <button type="button" class="gm-btn gm-btn-play" data-gm="play"${dis}>Play</button>
        <button type="button" class="gm-btn" data-gm="popout"${dis}>Pop out</button>
      </div>
      <div class="gm-foot gm-foot-2">
        <button type="button" class="gm-btn" data-gm="export"${dis}>Export zip</button>
        ${GamePanelMarkup._secondButton(game, dis)}
      </div>
      <div class="gm-note" hidden></div>`;
  }

  static _head(game, collapsed) {
    const esc = HtmlEscaper.escapeText;
    const status = game.status || 'editing';
    const kind = GamePanelMarkup.isAiGame(game)
      ? '<span class="gm-kind" title="AI-driven game: calls the model while it plays">AI</span>' : '';
    return `<div class="gm-head">
        <span class="gm-name">${esc(game.name || 'Game')}</span>
        ${kind}
        <span class="gm-status gm-${esc(status)}">${esc(GamePanelMarkup.STATUS_LABEL[status] || status)}</span>
        <button type="button" class="gm-collapse" data-gm="collapse"
          title="${collapsed ? 'Expand' : 'Collapse'}">${collapsed ? '▸' : '▾'}</button>
      </div>`;
  }

  static _rows(game) {
    const files = (game.files || []).map((f) => GamePanelMarkup._row(GamePanelMarkup.fileDot(f), f.path));
    const assets = (game.assets || []).map((a) => GamePanelMarkup._row(GamePanelMarkup.assetDot(a), a.path));
    return files.join('') + assets.join('');
  }

  static _row(dot, path) {
    const esc = HtmlEscaper.escapeText;
    return `<div class="gm-row"><span class="gm-dot ${dot.cls}" title="${esc(dot.title)}"></span><span class="gm-fname">${esc(path)}</span></div>`;
  }

  static _secondButton(game, dis) {
    return GamePanelMarkup.isAiGame(game)
      ? `<button type="button" class="gm-btn" data-gm="newgame"${dis} title="Wipe the game's saved data stores">New game</button>`
      : `<button type="button" class="gm-btn" data-gm="share"${dis}>Share link</button>`;
  }
}
