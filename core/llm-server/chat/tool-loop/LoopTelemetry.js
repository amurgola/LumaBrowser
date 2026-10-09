class LoopTelemetry {
  static MAX_EVENTS = 20;

  constructor() {
    this.requested = 0;
    this.ran = 0;
    this.held = 0;
    this.annotated = 0;
    this._noveltySum = 0;
    this._noveltyCount = 0;
    this._events = [];
  }

  noteRequest() {
    this.requested += 1;
  }

  noteRan(record) {
    this.ran += 1;
    if (record.novelty === null) return;
    this._noveltySum += record.novelty;
    this._noveltyCount += 1;
  }

  noteFinding(finding, level) {
    if (finding.held) this.held += 1;
    else this.annotated += 1;
    if (this._events.length >= LoopTelemetry.MAX_EVENTS) return;
    this._events.push({ step: finding.step, tool: finding.tool, pattern: finding.pattern, level, held: finding.held });
  }

  snapshot({ ladder, searchesSpent, searchAllowance }) {
    return {
      requested: this.requested,
      ran: this.ran,
      held: this.held,
      annotated: this.annotated,
      searchesSpent,
      searchAllowance,
      meanNovelty: this._noveltyCount ? this._noveltySum / this._noveltyCount : null,
      pressure: ladder.pressure,
      peakPressure: ladder.peak,
      level: ladder.level,
      events: this._events.slice(),
    };
  }
}

module.exports = LoopTelemetry;
