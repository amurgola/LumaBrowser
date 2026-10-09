module.exports = {
  id: 'on-demand-mode',
  name: 'Luma On Demand',
  version: '0.1.0',
  private: true,
  distributable: false,
  description:
    'The agent behind Luma On Demand, the floating Live panel on every web '
    + 'page. Say or type what you want done on the page you are looking at '
    + '("click the news button", "scroll to the comments", "what does this '
    + 'article say?") and it acts on that tab with the browser tools, guided '
    + 'by a bespoke knowledge base of web-page interaction patterns: finding '
    + 'elements, forms, consent banners, pagination, search and filters, '
    + 'single-page apps, and when to ask before an irreversible action.',

  dependencies: {
    optional: {
      'core:llm-service': {},
      'core:browser': {},
    },
  },

  main: './main.js',
};
