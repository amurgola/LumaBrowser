const TriggerRunPreamble = require('../triggers/TriggerRunPreamble');
const TriggerMemoryBlock = require('../triggers/TriggerMemoryBlock');
const TriggerMemoryPolicy = require('../trigger-store/TriggerMemoryPolicy');

class TriggerRunPrompt {
  static system(trigger, kind, event, cfg, run) {
    return [cfg.persona, TriggerRunPrompt._preamble(trigger, kind, event, run), run.memoryBlock || null]
      .filter(Boolean)
      .join('\n\n');
  }

  static memoryBlock(trigger, triggerStore) {
    try {
      const policy = TriggerMemoryPolicy.of(trigger);
      if (!policy) return null;
      const runs = triggerStore.listRuns(trigger.id, { limit: policy.runs || 1 });
      return TriggerMemoryBlock.build(trigger.memory, runs, { runsWanted: policy.runs, maxChars: policy.maxChars });
    } catch (_) {
      return null;
    }
  }

  static _preamble(trigger, kind, event, run) {
    const action = trigger.action || {};
    const subject = event && event.event === 'batch' ? { ...trigger, _batchCount: event.count } : trigger;
    return TriggerRunPreamble.build(subject, kind, {
      respondMode: (trigger.source && trigger.source.respond) || 'ack',
      sourceKind: trigger.kind,
      expect: action.expect,
      artifactRootId: action.artifactRootId,
      attempt: run.attempt || 1,
      previousError: run.previousError || null,
    });
  }
}

module.exports = TriggerRunPrompt;
