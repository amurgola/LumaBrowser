const FileEventBuilder = require('../triggers/file/FileEventBuilder');
const NotificationSource = require('../triggers/NotificationSource');
const TriggerPayload = require('../triggers/TriggerPayload');

class TriggerSampleEvent {
  static async for(trigger, body, pageSource = null) {
    if (trigger.kind === 'file') return TriggerSampleEvent._fileEvent(trigger, body);
    if (trigger.kind === 'page') return TriggerSampleEvent._pageEvent(trigger, pageSource);
    if (trigger.kind === 'notification') return TriggerSampleEvent._notificationEvent(trigger, body);
    return TriggerPayload.syntheticEvent(body);
  }

  static _fileEvent(trigger, body) {
    const candidate = body && typeof body === 'object' ? body.path : body;
    if (!candidate || typeof candidate !== 'string') throw new Error('a file trigger sample is the path of a file inside the watched folder');
    return FileEventBuilder.forPath(trigger.source.dir, candidate);
  }

  static _pageEvent(trigger, pageSource) {
    if (!pageSource) throw new Error('the page watcher is not available');
    return pageSource.sampleFor(trigger.source.monitorId);
  }

  static _notificationEvent(trigger, body) {
    if (body === undefined || body === null || body === '') throw new Error('a notification sample is the notification text, or JSON { title, body }');
    const event = NotificationSource.syntheticEvent(body);
    const source = trigger.source || {};
    if (!event.host && source.host) event.host = source.host;
    if (!event.tab && source.tabPartition) {
      event.tab = { id: null, partition: source.tabPartition, title: source.tabTitle || null, persisted: true };
    }
    return event;
  }
}

module.exports = TriggerSampleEvent;
