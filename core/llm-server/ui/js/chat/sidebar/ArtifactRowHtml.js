import ChatIcons from '../ChatIcons.js';
import RunTimeText from '../common/RunTimeText.js';
import ByteFormatter from '../../format/ByteFormatter.js';
import HtmlEscaper from '../../format/HtmlEscaper.js';

export default class ArtifactRowHtml {
  static scopeHead(eyebrow, title, count, extra, titleAttr) {
    const esc = HtmlEscaper.escape;
    return '<div class="cm-art-scope-head">'
      + '<div class="cm-art-scope-eyebrow">' + eyebrow + '</div>'
      + '<div class="cm-art-scope-title"' + (titleAttr ? ' title="' + esc(title) + '"' : '') + '>' + esc(title) + '</div>'
      + '<div class="cm-art-scope-count">' + count + ' item' + (count === 1 ? '' : 's') + (extra || '') + '</div></div>';
  }

  static row(a, opts) {
    const esc = HtmlEscaper.escape;
    const vc = a.versionCount || 1;
    const rootId = String(a.rootId || a.id);
    const sub = opts && opts.global ? ArtifactRowHtml._subLine(a) : '';
    return '<div class="cm-conv cm-art-row" data-art-id="' + esc(String(a.id)) + '" data-art-root="' + esc(rootId) + '">'
      + '<span class="cm-conv-title">' + esc(a.title || 'Artifact') + ' <span class="cm-art-kind">' + esc(a.type || '') + '</span>'
      + ArtifactRowHtml._versionBadge(vc) + sub + '</span>'
      + '<button type="button" class="cm-conv-menu cm-conv-trash" data-art-del title="'
      + (vc > 1 ? 'Delete artifact (all ' + vc + ' versions)' : 'Delete artifact') + '">' + ChatIcons.trash + '</button>'
      + '</div>'
      + '<div class="cm-art-versions" data-art-versions-for="' + esc(rootId) + '" hidden></div>';
  }

  static versions(vers) {
    const esc = HtmlEscaper.escape;
    return vers.slice().reverse().map((v) =>
      '<div class="cm-art-ver" data-ver-id="' + esc(String(v.id)) + '"'
      + ' data-ver-type="' + esc(String(v.type || '')) + '"'
      + ' data-ver-url="' + esc(String(v.url || '')) + '"'
      + ' data-ver-lang="' + esc(String(v.language || '')) + '"'
      + ' data-ver-title="' + esc(String(v.title || '')) + '">'
      + '<span class="cm-art-ver-n">v' + v.version + '</span>'
      + '<span class="cm-art-ver-t">' + esc(RunTimeText.when(v.createdAt)) + '</span>'
      + '</div>').join('') || '<div class="cm-art-ver cm-art-ver-msg">No history.</div>';
  }

  static bytes(n) {
    return ByteFormatter.bytes(n, { zero: '0 B' });
  }

  static _versionBadge(vc) {
    if (vc <= 1) return '';
    return ' <button type="button" class="cm-art-vbadge" data-art-hist title="Show version history">v' + vc + ' ▾</button>';
  }

  static _subLine(a) {
    const esc = HtmlEscaper.escape;
    const scope = (a.conversationId && !a.orphaned)
      ? '<button type="button" class="cm-art-conv-link" data-art-conv="' + esc(String(a.conversationId))
        + '" title="Open this conversation">' + esc(a.conversationTitle || 'Conversation') + '</button>'
      : '<span class="cm-art-noconv">Not in a conversation</span>';
    const size = a.bytes ? '<span class="cm-art-size">' + ArtifactRowHtml.bytes(a.bytes) + '</span>' : '';
    return '<span class="cm-art-sub">' + scope + size + '</span>';
  }
}
