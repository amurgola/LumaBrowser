const ArtifactTaskStore = require('../ArtifactTaskStore');

class ScheduleBounds {
  static MIN_EVERY_MINUTES = Math.round(ArtifactTaskStore.MIN_INTERVAL_MS / 60000);
  static MAX_EVERY_MINUTES = Math.round(ArtifactTaskStore.MAX_INTERVAL_MS / 60000);

  static rangeText() {
    return `${ScheduleBounds.MIN_EVERY_MINUTES} to ${ScheduleBounds.MAX_EVERY_MINUTES}`;
  }
}

module.exports = ScheduleBounds;
