const LookupReply = require('./LookupReply');
const MatchExcerpts = require('./MatchExcerpts');
const PageClassifier = require('./PageClassifier');
const PageNotes = require('./PageNotes');
const TextPager = require('./TextPager');

class PageReport {
  static EXCERPT_DIVIDER = '\n\n---\n\n';

  static render(document, view) {
    return new PageReport(document, view).execute();
  }

  constructor(document, view) {
    this._doc = document;
    this._view = view;
    this._pager = new TextPager(document.text, view.partChars);
  }

  execute() {
    if (!this._pager.part(this._view.part)) return this._missingPart();
    const body = this._matchesBody() || this._partBody();
    const thin = !body.termFound && !PageClassifier.isProse(this._doc.text);
    const sections = [this._view.preface, this._headline(), body.text, PageNotes.collect(this._doc, { thin }), body.footer];
    return LookupReply.ok(sections.filter(Boolean).join('\n\n'), {
      url: this._doc.url,
      part: body.part,
      parts: this._pager.count(),
      thin,
      ...(this._doc.viaBrowser ? { viaBrowser: true } : { status: this._doc.status }),
    });
  }

  _headline() {
    const origin = this._doc.viaBrowser ? 'rendered in a browser tab (scripts on, ads blocked)' : `HTTP ${this._doc.status}`;
    const reuse = this._view.fromCache ? ', reused from earlier in this task' : '';
    return `${this._doc.url} (${origin}), read ${LookupReply.today()}${reuse}:`;
  }

  _matchesBody() {
    const term = this._view.find;
    if (!term) return null;
    const { total, excerpts } = MatchExcerpts.extract(this._doc.text, term, { maxExcerpts: this._excerptCap(term) });
    if (!total) {
      const fallback = this._partBody();
      return { ...fallback, text: `"${term}" does not appear on this page, so part ${fallback.part} is shown instead.\n\n${fallback.text}` };
    }
    const shown = excerpts.map((excerpt) => `[in part ${this._pager.partAt(excerpt.start)}]\n${excerpt.text}`);
    return {
      termFound: true,
      part: null,
      text: `"${term}" appears ${total} time(s); ${excerpts.length} excerpt(s) follow.\n\n${shown.join(PageReport.EXCERPT_DIVIDER)}`,
      footer: this._pager.count() > 1 ? `[To read around a match in full, open its part: ${this._call(this._pager.partAt(excerpts[0].start))}.]` : '',
    };
  }

  _excerptCap(term) {
    return Math.max(1, Math.floor(this._view.partChars / (2 * MatchExcerpts.RADIUS + term.length)));
  }

  _partBody() {
    const part = this._pager.part(this._view.part);
    return { termFound: false, part: part.number, text: part.text || '(This part is empty.)', footer: this._continuation(part) };
  }

  _continuation(part) {
    if (part.count === 1) return '';
    if (part.number === part.count) return `[Part ${part.number} of ${part.count}: the end of the page.]`;
    return `[Part ${part.number} of ${part.count}, characters ${part.start + 1}-${part.end} of ${part.totalChars}. `
      + `Continue with ${this._call(part.number + 1)}, or add "find" to jump to a term.]`;
  }

  _call(partNumber) {
    return JSON.stringify({ url: this._view.handle, part: partNumber });
  }

  _missingPart() {
    const count = this._pager.count();
    return LookupReply.fail(
      `${this._doc.url} has ${count} part(s) at this reading size, so there is no part ${this._view.part}.`,
      `Ask for "part" 1-${count}, or use "find" to jump to a term.`,
    );
  }
}

module.exports = PageReport;
