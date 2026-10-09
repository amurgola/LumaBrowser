import HtmlEscaper from '../../../core/llm-server/ui/js/format/HtmlEscaper.js';

export default class SuggestionsHtml {
  static SEARCH_ICON = '<span class="bd-suggest-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg></span>';

  static GLOBE_ICON = '<span class="bd-suggest-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg></span>';

  static render({ items, active, query, engineName, favicons }) {
    const rows = items.map((item, i) => {
      const cls = i === active ? ' bd-active' : '';
      const { icon, main } = SuggestionsHtml._row(item, query, engineName, favicons);
      return `<div class="url-suggestion${cls}" data-bd-action="commit" data-bd-index="${i}">${icon}${main}</div>`;
    }).join('');
    return `<div class="url-suggestions">${rows}</div>`;
  }

  static _row(item, query, engineName, favicons) {
    const esc = HtmlEscaper.escape;
    if (item.kind === 'search') {
      return {
        icon: SuggestionsHtml.SEARCH_ICON,
        main: `<span class="bd-suggest-main"><span class="bd-suggest-title">Search ${esc(engineName)} for &ldquo;<span class="bd-suggest-search">${esc(query)}</span>&rdquo;</span></span>`,
      };
    }
    if (item.kind === 'navigate') {
      return {
        icon: SuggestionsHtml.GLOBE_ICON,
        main: `<span class="bd-suggest-main"><span class="bd-suggest-title">${esc(item.url)}</span><span class="bd-suggest-url">Go to address</span></span>`,
      };
    }
    return {
      icon: `<span class="bd-suggest-icon">${favicons.html(item.url, item.title)}</span>`,
      main: `<span class="bd-suggest-main"><span class="bd-suggest-title">${esc(item.title || item.url)}</span><span class="bd-suggest-url">${esc(item.url)}</span></span>`,
    };
  }
}
