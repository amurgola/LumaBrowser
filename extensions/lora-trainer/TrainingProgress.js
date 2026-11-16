class TrainingProgress {
  static BAR = /(\d{1,3})%\|[^|]*\|\s*(\d+)\/(\d+)\s*\[([^\]]*)\]/;
  static TIME_LEFT = /<\s*([0-9:]+)/;
  static LOSS = /loss:\s*([0-9.]+(?:e[+-]?\d+)?)/i;
  static DETAIL_MAX = 160;

  constructor(jobName) {
    this._prefix = `${jobName}:`;
  }

  read(line) {
    const text = String(line || '').trim();
    if (!text) return null;
    const bar = text.startsWith(this._prefix) ? TrainingProgress.BAR.exec(text) : null;
    return bar ? TrainingProgress._steps(bar) : { detail: text.slice(0, TrainingProgress.DETAIL_MAX) };
  }

  static _steps(bar) {
    const inside = bar[4];
    const loss = TrainingProgress.LOSS.exec(inside);
    const timeLeft = TrainingProgress.TIME_LEFT.exec(inside);
    return {
      step: Number(bar[2]),
      totalSteps: Number(bar[3]),
      loss: loss ? Number(loss[1]) : null,
      timeLeft: timeLeft ? timeLeft[1] : null,
    };
  }
}

module.exports = TrainingProgress;
