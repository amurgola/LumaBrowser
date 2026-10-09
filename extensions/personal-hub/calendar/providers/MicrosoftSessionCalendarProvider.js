const CalendarProvider = require('../CalendarProvider');
const MicrosoftCalendarProvider = require('./MicrosoftCalendarProvider');

class MicrosoftSessionCalendarProvider extends CalendarProvider {
  static KIND = 'microsoft-session';

  constructor({ getToken = async () => { throw new Error('Microsoft 365: no signed-in tab is available.'); }, graph = new MicrosoftCalendarProvider() } = {}) {
    super();
    this._getToken = getToken;
    this._graph = graph;
  }

  validateConfig(config) {
    if (!config || !String(config.partition || '').trim()) return 'Pick the Microsoft account from a signed-in Teams or Outlook tab.';
    return null;
  }

  async fetchEvents(source, { from, to, fetchImpl } = {}) {
    const config = (source && source.config) || {};
    const accessToken = await this._getToken(config.partition);
    try {
      return await this._graph.fetchEvents(source, { from, to, credentials: { accessToken }, fetchImpl });
    } catch (err) {
      if (/HTTP 401/.test(err && err.message)) throw new Error('Microsoft 365: the signed-in tab\'s session was refused; sign in again in the Teams or Outlook tab.');
      throw err;
    }
  }
}

module.exports = MicrosoftSessionCalendarProvider;
