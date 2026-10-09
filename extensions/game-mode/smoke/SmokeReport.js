const SmokeActions = require('./SmokeActions');
const SmokeErrorFormatter = require('./SmokeErrorFormatter');
const PhaserProbeReport = require('./PhaserProbeReport');

class SmokeReport {
  static MAX_ERRORS = 8;
  static MAX_LOGS = 12;
  static EMPTY_REPORT = { errors: [], warnings: [], logs: [], resources: [], inputs: 0, canvas: null, games: [] };

  static format(res) {
    return SmokeReport._unavailable(res) || SmokeReport._unassembled(res) || SmokeReport._notLoaded(res) || new SmokeReport(res).execute();
  }

  static describeShot(s) {
    if (!s || !s.stats) return `${s ? s.label : 'frame'}: no frame captured`;
    const st = s.stats;
    const pct = (f) => `${Math.round(f * 100)}%`;
    const base = `${s.label} (${(s.at / 1000).toFixed(1)}s): ${pct(st.blackFrac)} black, ${pct(st.darkFrac)} dark, mean brightness ${st.meanLum}/255, ${st.colors} colours`;
    if (st.verdict === 'black') return `${base}: BLACK SCREEN. The player sees nothing.`;
    if (st.verdict === 'nearly-black') return `${base}: nearly black; only faint content is visible.`;
    if (st.verdict === 'flat') return `${base}: flat colour, no scene detail.`;
    return `${base}: content is rendering.`;
  }

  static _unavailable(res) {
    if (res && res.available) return null;
    return {
      ok: false,
      message: res && res.busy
        ? 'A smoke run is already in progress; wait for it and do not call run_game again this step.'
        : 'run_game is unavailable in this install (no window runtime here). Skip smoke testing: rely on '
          + 'the write-time validation and ask the user to press Play and report what they see.',
      summary: 'smoke · unavailable',
    };
  }

  static _unassembled(res) {
    if (!res.flattenError) return null;
    return {
      ok: false,
      message: `Could not assemble the game to run it: ${res.flattenError}. Check that index.html exists `
        + 'and loads Phaser plus your scripts.',
      summary: 'smoke · could not assemble',
    };
  }

  static _notLoaded(res) {
    if (res.loaded) return null;
    const extra = (res.consoleErrors || []).slice(0, 3).map((e) => `- ${e.message}`).join('\n');
    return {
      ok: false,
      message: `The game page failed to load: ${res.loadError}.${extra ? `\nConsole said:\n${extra}` : ''}`,
      summary: 'smoke · page failed to load',
    };
  }

  constructor(res) {
    this._res = res;
    this._report = res.report || SmokeReport.EMPTY_REPORT;
    this._lines = [];
  }

  execute() {
    this._errors = this._allErrors();
    const shots = Array.isArray(this._res.shots) ? this._res.shots : [];
    const last = shots.length ? shots[shots.length - 1] : null;
    this._screen = last && last.stats ? last.stats.verdict : null;
    this._header();
    this._canvas();
    this._screenCheck(shots);
    this._lines.push(...PhaserProbeReport.lines(this._report.games));
    this._errorsBlock();
    this._resourcesAndConsole();
    this._frameRate();
    return this._verdict();
  }

  _allErrors() {
    const errors = [...(this._report.errors || [])];
    for (const ce of this._res.consoleErrors || []) {
      const msg = String(ce.message || '');
      if (!errors.some((e) => msg.includes(e.message) || e.message.includes(msg))) {
        errors.push({ message: msg, source: ce.source, line: ce.line, stack: '', count: 1 });
      }
    }
    return errors;
  }

  _header() {
    const acts = Array.isArray(this._res.actions) ? this._res.actions : [];
    const source = this._res.url ? 'from the LIVE play URL (AI runtime online, as the user gets it)' : 'from an offline copy (AI runtime offline)';
    const input = acts.length
      ? ` with ${acts.length} scripted action${acts.length === 1 ? '' : 's'}: ${acts.map(SmokeActions.describe).join('; ')}.`
      : ` with ${this._report.inputs || 0} synthetic inputs (Space taps + clicks on the canvas centre).`;
    this._lines.push(`Ran the game headlessly for ${this._res.seconds}s ${source}${input}`);
  }

  _canvas() {
    const canvas = this._report.canvas;
    this._lines.push(canvas
      ? `Game canvas mounted (${canvas.width}x${canvas.height}).`
      : 'NO game canvas mounted: Phaser never booted. Check that index.html lists every script '
        + 'in dependency order ending with src/main.js, and that main.js creates the Phaser.Game.');
  }

  _screenCheck(shots) {
    if (!shots.length) return;
    this._lines.push('SCREEN CHECK (the game canvas, measured):');
    shots.forEach((s) => this._lines.push(`- ${SmokeReport.describeShot(s)}`));
    if (this._isBlack()) {
      this._lines.push('The final frame is (nearly) black: whatever your code thinks it drew, the player sees a black canvas. '
        + 'Treat this as a bug even with zero runtime errors. Use the Phaser probe below: is the scene you expect '
        + 'active? Are its objects visible? Is the camera scrolled away, zoomed, or still faded out? Are the textures '
        + 'it uses actually loaded (not __MISSING)?');
    }
  }

  _errorsBlock() {
    const errors = this._errors;
    if (!errors.length) return;
    this._lines.push(`${errors.length} runtime error${errors.length === 1 ? '' : 's'}:`);
    errors.slice(0, SmokeReport.MAX_ERRORS).forEach((e, i) => this._lines.push(SmokeErrorFormatter.format(e, i)));
    if (errors.length > SmokeReport.MAX_ERRORS) this._lines.push(`…and ${errors.length - SmokeReport.MAX_ERRORS} more.`);
  }

  _resourcesAndConsole() {
    const resources = this._report.resources || [];
    if (resources.length) this._lines.push(`Failed to load: ${resources.map((r) => SmokeErrorFormatter.prettySource(r.url) || r.url).join(', ')}`);
    const warnings = this._report.warnings || [];
    if (warnings.length && !this._errors.length) this._lines.push(`Console warnings: ${warnings.slice(0, 3).map((w) => w.message).join(' | ')}`);
    const logs = (this._report.logs || []).slice(-SmokeReport.MAX_LOGS);
    if (!logs.length) return;
    this._lines.push(`Console output (last ${logs.length}):`);
    logs.forEach((l) => this._lines.push(`  ${l.message}${l.count > 1 ? ` (x${l.count})` : ''}`));
  }

  _frameRate() {
    const frames = this._report.frames;
    if (Number.isFinite(frames) && frames < this._res.seconds * 10) {
      this._lines.push(`Note: the render loop only ticked ${frames} frames in ${this._res.seconds}s; the game may be stalled.`);
    }
  }

  _isBlack() {
    return this._screen === 'black' || this._screen === 'nearly-black';
  }

  _verdict() {
    const ok = !!this._report.canvas && !this._errors.length && !this._isBlack();
    const seen = this._screen === 'content' || this._screen === 'flat';
    this._lines.push(ok
      ? `No runtime errors detected${seen ? ' and the canvas is painting content' : ''}. This proves the game boots${seen ? ' and draws' : ' (no frame was captured, so not that it draws)'}; the user `
        + 'is still the judge of whether it plays well; tell them to press Play.'
      : 'Fix these, then call run_game again (with actions that reach the broken screen) until it comes back clean.');
    return { ok, screen: this._screen, message: this._lines.join('\n'), summary: this._summary(ok, seen) };
  }

  _summary(ok, seen) {
    if (ok) return seen ? 'smoke · clean · screen ok' : 'smoke · clean';
    const bits = [];
    if (this._errors.length) bits.push(`${this._errors.length} error${this._errors.length === 1 ? '' : 's'}`);
    if (!this._report.canvas) bits.push('no canvas');
    if (this._isBlack()) bits.push('BLACK SCREEN');
    return `smoke · ${bits.join(' · ') || 'issues'}`;
  }
}

module.exports = SmokeReport;
