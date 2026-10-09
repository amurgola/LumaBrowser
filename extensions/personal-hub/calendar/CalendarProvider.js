class CalendarProvider {
  static KIND = null;

  validateConfig(_config) {
    throw new Error(`${this.constructor.name} must implement validateConfig()`);
  }

  async fetchEvents(_source, _options) {
    throw new Error(`${this.constructor.name} must implement fetchEvents()`);
  }

  needsOAuth() {
    return false;
  }

  static clipWindow(events, from, to) {
    const fromMs = CalendarProvider._ms(from);
    const toMs = CalendarProvider._ms(to);
    return (events || []).filter((event) => {
      const start = CalendarProvider._ms(event.startsAt);
      const end = event.endsAt ? CalendarProvider._ms(event.endsAt) : start;
      if (!Number.isFinite(start)) return false;
      if (start >= toMs) return false;
      return end > fromMs || (end === start && start >= fromMs);
    });
  }

  static _ms(value) {
    return typeof value === 'number' ? value : Date.parse(value);
  }
}

module.exports = CalendarProvider;
