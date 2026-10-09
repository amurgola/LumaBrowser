class TranscriptHealth {
  static COUNTED_FIELDS = ['offFormatCalls', 'lengthCutCompletions', 'missingArgCalls', 'overflowRecoveries'];

  static harvest(transcripts) {
    const totals = TranscriptHealth._emptyTotals();
    for (const transcript of transcripts) {
      if (transcript) TranscriptHealth._addTranscript(totals, transcript);
    }
    return totals;
  }

  static _emptyTotals() {
    return {
      repetitionAborted: 0, offFormatCalls: 0, emptyReplies: 0, timedOut: 0, errors: 0, turns: 0,
      lengthCutCompletions: 0, missingArgCalls: 0, overflowRecoveries: 0,
      offFormatShapes: {},
    };
  }

  static _addTranscript(totals, transcript) {
    const health = transcript.health || {};
    totals.turns += 1;
    if (health.repetitionAborted) totals.repetitionAborted += 1;
    if (health.timedOut) totals.timedOut += 1;
    for (const field of TranscriptHealth.COUNTED_FIELDS) totals[field] += Number(health[field] || 0);
    TranscriptHealth._addShapes(totals.offFormatShapes, health.offFormatShapes);
    if (health.emptyReply || TranscriptHealth._saidAndDidNothing(transcript)) totals.emptyReplies += 1;
    if (transcript.error) totals.errors += 1;
  }

  static _addShapes(target, shapes) {
    for (const [shape, count] of Object.entries(shapes || {})) {
      target[shape] = (target[shape] || 0) + Number(count || 0);
    }
  }

  static _saidAndDidNothing(transcript) {
    const said = String(transcript.finalResponse || '').trim().length > 0;
    const acted = Array.isArray(transcript.toolCalls) && transcript.toolCalls.length > 0;
    return !said && !acted && !transcript.error;
  }
}

module.exports = TranscriptHealth;
