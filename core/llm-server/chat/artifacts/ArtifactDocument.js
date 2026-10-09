const HtmlText = require('./HtmlText');
const ArtifactDocumentShell = require('./ArtifactDocumentShell');
const ArtifactMarkdown = require('./ArtifactMarkdown');
const LiveModuleDocument = require('./LiveModuleDocument');

class ArtifactDocument {
  static FULL_DOCUMENT = /<!doctype html|<html[\s>]/i;

  static render(row, opts = {}, configuredBase = null) {
    const title = HtmlText.escape(row.title);
    if (row.type === 'html' && ArtifactDocument.FULL_DOCUMENT.test(row.content)) return row.content;
    return ArtifactDocumentShell.wrap(title, ArtifactDocument._body(row, title, opts, configuredBase));
  }

  static _body(row, title, opts, configuredBase) {
    switch (row.type) {
      case 'html': return `<div class="cm-art-body">${row.content}</div>`;
      case 'svg': return `<div class="cm-art-center">${row.content}</div>`;
      case 'image': return ArtifactDocument._centered(`<img class="cm-art-img" alt="${title}" src="${ArtifactDocument._dataUrl(row, 'image/png')}"/>`);
      case 'video': return ArtifactDocument._centered(ArtifactDocument._videoElement(row, title));
      case 'audio': return ArtifactDocument._centered(`<audio src="${ArtifactDocument._dataUrl(row, 'audio/wav')}" controls style="width:100%"></audio>`);
      case 'markdown': return `<article class="cm-art-md">${ArtifactMarkdown.toHtml(row.content)}</article>`;
      case 'live': return LiveModuleDocument.renderBody(row, opts, configuredBase);
      default: return ArtifactDocument._codeBody(row);
    }
  }

  static _videoElement(row, title) {
    const src = ArtifactDocument._dataUrl(row, 'video/mp4');
    if (/^image\//i.test(row.language || 'video/mp4')) return `<img class="cm-art-img" alt="${title}" src="${src}"/>`;
    return `<video class="cm-art-img" src="${src}" controls autoplay loop muted playsinline></video>`;
  }

  static _codeBody(row) {
    const language = row.language ? HtmlText.escape(row.language) : 'text';
    return `<div class="cm-art-codehead">${HtmlText.escape(row.title)} · ${language}</div>`
      + `<pre class="cm-art-code"><code>${HtmlText.escape(row.content)}</code></pre>`;
  }

  static _centered(element) {
    return `<div class="cm-art-center">${element}</div>`;
  }

  static _dataUrl(row, fallbackMime) {
    return `data:${HtmlText.escape(row.language || fallbackMime)};base64,${HtmlText.escape(row.content)}`;
  }
}

module.exports = ArtifactDocument;
