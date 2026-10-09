const SyncSourceRepository = require('../sync/SyncSourceRepository');

class CalendarSourceRepository extends SyncSourceRepository {
  static TABLE = 'hub_calendar_sources';
  static HAS_COLOR = true;
}

module.exports = CalendarSourceRepository;
