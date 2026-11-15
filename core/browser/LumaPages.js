const NewTabPage = require('./newtab/NewTabPage');
const TerminalPage = require('../terminal/TerminalPage');

class LumaPages {
  static SCHEME = NewTabPage.SCHEME;
  static PAGES = [NewTabPage, TerminalPage];

  static _sessions = new WeakSet();

  static attach(sess, fetchFile) {
    if (!sess || !sess.protocol || LumaPages._sessions.has(sess)) return;
    LumaPages._sessions.add(sess);
    try {
      if (typeof sess.protocol.registerSource === 'function') sess.protocol.registerSource(LumaPages.SCHEME, LumaPages.source());
      else sess.protocol.handle(LumaPages.SCHEME, (request) => LumaPages.serve(request.url, fetchFile));
    } catch (_) {}
  }

  static source() {
    return { routes: LumaPages.PAGES.flatMap((page) => page.routes()) };
  }

  static serve(url, fetchFile) {
    let host = null;
    try { host = new URL(url).hostname; } catch (_) {}
    const page = LumaPages.PAGES.find((candidate) => candidate.HOST === host);
    return page ? page.serve(url, fetchFile) : new Response('Not found', { status: 404 });
  }
}

module.exports = LumaPages;
