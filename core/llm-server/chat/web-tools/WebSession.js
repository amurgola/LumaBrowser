const PageCache = require('./PageCache');
const ResultMemory = require('./ResultMemory');

class WebSession {
  constructor({ results = new ResultMemory(), pages = new PageCache() } = {}) {
    this.results = results;
    this.pages = pages;
  }
}

module.exports = WebSession;
