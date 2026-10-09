class InterventionLadder {
  static RUNGS = ['calm', 'steer', 'insist', 'conclude'];

  constructor() {
    this.pressure = 0;
    this.peak = 0;
  }

  get level() {
    const rungs = InterventionLadder.RUNGS;
    return rungs[Math.min(this.pressure, rungs.length - 1)];
  }

  climb() {
    this.pressure += 1;
    this.peak = Math.max(this.peak, this.pressure);
    return this.level;
  }

  ease() {
    this.pressure = Math.max(0, this.pressure - 1);
  }
}

module.exports = InterventionLadder;
