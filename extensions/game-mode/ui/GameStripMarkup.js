import ChatIcons from '../../../core/llm-server/ui/js/chat/ChatIcons.js';
import HtmlEscaper from '../../../core/llm-server/ui/js/format/HtmlEscaper.js';

export default class GameStripMarkup {
  static STATUS_LABEL = { editing: 'Building', ready: 'Ready', error: 'Needs fixing', stopped: 'Stopped' };

  static ART_LABEL = { pending: 'Waiting for its render', placeholder: 'Placeholder', error: 'Render failed' };

  static hasContent(game) {
    return !!(game && ((game.files && game.files.length) || (game.assets && game.assets.length) || game.playable));
  }

  static isAiGame(game) {
    return !!(game && game.gameKind === 'ai');
  }

  static unfinishedArt(game) {
    return ((game && game.assets) || []).filter((asset) => asset.status !== 'done');
  }

  static counts(game) {
    const files = (game.files || []).length;
    const assets = (game.assets || []).length;
    const missing = GameStripMarkup.unfinishedArt(game).length;
    const parts = [];
    if (files) parts.push(`${files} file${files === 1 ? '' : 's'}`);
    if (missing) parts.push(`art ${assets - missing} of ${assets}`);
    return parts.join(' · ');
  }

  static writingPath(game) {
    const writing = ((game && game.files) || []).find((file) => file.phase === 'writing');
    return writing ? String(writing.path) : '';
  }

  static html(game, { collapsed = true, note = null } = {}) {
    return GameStripMarkup._head(game, collapsed)
      + (collapsed ? '' : GameStripMarkup._list(game))
      + GameStripMarkup._note(note);
  }

  static _head(game, collapsed) {
    const esc = HtmlEscaper.escapeText;
    const status = game.status || 'editing';
    const kind = GameStripMarkup.isAiGame(game)
      ? '<span class="gm-kind" title="AI-driven game: calls the model while it plays">AI</span>' : '';
    return '<div class="gm-strip-head">'
      + `<button class="cm-plan-toggle" type="button" data-gm="collapse" aria-expanded="${collapsed ? 'false' : 'true'}" title="${collapsed ? 'Show the files' : 'Hide the files'}">${ChatIcons.chevron}</button>`
      + `<span class="gm-name">${esc(game.name || 'Game')}</span>`
      + kind
      + `<span class="gm-status gm-${esc(status)}">${esc(GameStripMarkup.STATUS_LABEL[status] || status)}</span>`
      + `<span class="gm-count">${esc(GameStripMarkup.counts(game))}</span>`
      + GameStripMarkup._now(game, collapsed)
      + GameStripMarkup._actions(game)
      + '</div>';
  }

  static _now(game, collapsed) {
    const path = collapsed ? GameStripMarkup.writingPath(game) : '';
    return `<span class="gm-now">${path ? `Writing <span class="gm-now-path">${HtmlEscaper.escapeText(path)}</span>` : ''}</span>`;
  }

  static _actions(game) {
    const dis = game.playable ? '' : ' disabled';
    return '<span class="gm-actions">'
      + `<button type="button" class="gm-btn gm-btn-play" data-gm="play"${dis}>Play</button>`
      + `<button type="button" class="gm-btn" data-gm="popout"${dis}>Pop out</button>`
      + `<button type="button" class="gm-btn" data-gm="export"${dis}>Export zip</button>`
      + GameStripMarkup._lastButton(game, dis)
      + '</span>';
  }

  static _lastButton(game, dis) {
    return GameStripMarkup.isAiGame(game)
      ? `<button type="button" class="gm-btn" data-gm="newgame"${dis} title="Wipe the game's saved data stores">New game</button>`
      : `<button type="button" class="gm-btn" data-gm="share"${dis}>Share link</button>`;
  }

  static _list(game) {
    const rows = (game.files || []).map((file) => GameStripMarkup._fileRow(file))
      .concat(GameStripMarkup.unfinishedArt(game).map((asset) => GameStripMarkup._artRow(asset)));
    return rows.length ? `<div class="gm-list">${rows.join('')}</div>` : '';
  }

  static _fileRow(file) {
    if (file.phase === 'writing') return GameStripMarkup._row('writing', file.path, 'Writing');
    return file.ok ? GameStripMarkup._row('ok', file.path, '') : GameStripMarkup._row('bad', file.path, 'Has problems');
  }

  static _artRow(asset) {
    const dot = asset.status === 'error' ? 'bad' : 'queued';
    return GameStripMarkup._row(dot, asset.path, GameStripMarkup.ART_LABEL[asset.status] || String(asset.status || ''));
  }

  static _row(dot, path, word) {
    const esc = HtmlEscaper.escapeText;
    return `<div class="gm-row"><span class="gm-dot ${dot}"></span><span class="gm-fname">${esc(path)}</span>`
      + (word ? `<span class="gm-row-state${dot === 'bad' ? ' gm-row-bad' : ''}">${esc(word)}</span>` : '')
      + '</div>';
  }

  static _note(note) {
    if (!note || !note.text) return '';
    return `<div class="gm-note${note.isErr ? ' gm-note-err' : ''}" role="${note.isErr ? 'alert' : 'status'}">${HtmlEscaper.escapeText(note.text)}</div>`;
  }
}
