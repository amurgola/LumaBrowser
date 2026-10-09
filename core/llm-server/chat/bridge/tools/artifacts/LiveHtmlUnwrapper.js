class LiveHtmlUnwrapper {
  static unwrap(content) {
    const scripts = [];
    let s = String(content || '').replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi, (m, attrs, body) => {
      if (/\bsrc\s*=/i.test(attrs)) return '';
      if (body && body.trim()) scripts.push(body.trim());
      return '';
    });
    const bodyMatch = s.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
    s = bodyMatch ? bodyMatch[1] : LiveHtmlUnwrapper._withoutDocumentWrapper(s);
    return { html: s.trim(), js: scripts.join('\n\n') };
  }

  static _withoutDocumentWrapper(s) {
    return s.replace(/<!doctype[^>]*>/gi, '')
      .replace(/<\/?html\b[^>]*>/gi, '')
      .replace(/<head\b[^>]*>[\s\S]*?<\/head>/gi, '')
      .replace(/<\/?body\b[^>]*>/gi, '');
  }
}

module.exports = LiveHtmlUnwrapper;
