const AgentLoopText = require('../../../agent/AgentLoopText');
const IterationStream = require('./IterationStream');
const TurnReminder = require('./TurnReminder');

class CompletionDriver {
  static DEFAULT_TEMPERATURE = 0.2;
  static EMPTY_COMPLETION = { success: true, response: { choices: [{ message: { content: '' } }] } };

  constructor(o) {
    this._o = o;
    this.sendCompletion = (slotId, msgs, opts) => this._send(slotId, msgs, opts);
  }

  async _send(_slotId, msgs, opts) {
    if (CompletionDriver._isSummaryRequest(msgs)) return CompletionDriver.EMPTY_COMPLETION;
    const o = this._o;
    o.mirror.beginIteration();
    o.reasoning.beginIteration();
    const stream = new IterationStream({ hooks: o.hooks, mirror: o.mirror, allows: o.toolSet.allows });
    const sendMsgs = TurnReminder.append(msgs, this._reminder());
    const completion = await o.router._completeOnce(
      o.modelRef, sendMsgs, this._temperature(opts),
      (p) => { if (o.hooks.onStatus) o.hooks.onStatus(p); },
      stream.onToken,
      o.reasoning.onToken,
      (usage) => o.health.onUsage(usage),
      (timings) => o.health.onTimings(timings),
      o.images.forCompletion(),
      o.nativePlan.build(o.toolSet),
      this._extra(sendMsgs, opts),
      o.control.completionControl,
    );
    o.control.clearLive();
    if (o.health.noteCompletion(completion)) o.replyCap.noteLengthCut();
    return completion;
  }

  static _isSummaryRequest(msgs) {
    const sys = msgs && msgs[0] && msgs[0].role === 'system' ? String(msgs[0].content || '') : '';
    return sys.startsWith(AgentLoopText.SUMMARY_INSTRUCTION);
  }

  _reminder() {
    const o = this._o;
    return TurnReminder.compose({
      turnReminder: o.turnReminder,
      nativeTools: o.nativePlan.enabled,
      offFormat: o.parser.sawOffFormat,
      parallel: o.parallel,
    });
  }

  _temperature(opts) {
    if (opts && opts.temperature != null) return opts.temperature;
    return this._o.temperature != null ? this._o.temperature : CompletionDriver.DEFAULT_TEMPERATURE;
  }

  _extra(sendMsgs, opts) {
    const o = this._o;
    return {
      ...(o.llmExtra || {}),
      trace: {
        conversationId: o.conversationId,
        turnId: o.assistantMessageId,
        callType: (opts && opts.purpose === 'compact') ? 'compact' : 'chat',
      },
      pinTemperature: true,
      maxTokens: o.replyCap.maxTokens(sendMsgs),
    };
  }
}

module.exports = CompletionDriver;
