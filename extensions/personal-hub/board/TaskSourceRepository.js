const SyncSourceRepository = require('../sync/SyncSourceRepository');

class TaskSourceRepository extends SyncSourceRepository {
  static TABLE = 'hub_task_sources';
  static HAS_COLOR = false;
}

module.exports = TaskSourceRepository;
