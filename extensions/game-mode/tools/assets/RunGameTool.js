const path = require('path');
const GameTool = require('../GameTool');
const GameKind = require('../../session/GameKind');
const SmokeRunner = require('../../smoke/SmokeRunner');
const SmokeReport = require('../../smoke/SmokeReport');

class RunGameTool extends GameTool {
  constructor(scope, { modelRef = null, gatewayInfo = null } = {}) {
    super(scope);
    this._modelRef = modelRef;
    this._gatewayInfo = gatewayInfo;
  }

  get name() { return 'run_game'; }

  get description() {
    return 'Boot the current game headlessly, LOOK at it, and report what actually happens at runtime: '
      + 'a SCREEN CHECK measured on the game canvas (how black it is, how many colours; a black canvas is a '
      + 'bug even with zero errors), every uncaught error with file:line and stack, whether the canvas '
      + 'mounted, failed asset loads, console output, and a Phaser probe (active scenes, visible objects, '
      + 'camera scroll/zoom/fade, textures in use / missing). Pass `actions` to drive YOUR OWN game: click '
      + 'your menu button, press E next to a character, type into your dialog box, so the run reaches the '
      + 'screen you want checked; without actions it taps Space and clicks the canvas centre. Coordinates are '
      + 'game coordinates (your Phaser.Game width/height). When the model can see images, the final frame is '
      + 'attached as a picture. For AI games the run loads the LIVE play page (AI runtime online, exactly '
      + 'what the user gets). Call it after wiring index.html and after any risky change, and fix everything '
      + 'it reports before telling the user to press Play. It proves the game boots AND draws; only the user '
      + 'can judge feel and fun.';
  }

  get inputSchema() {
    return {
      type: 'object',
      properties: {
        seconds: { type: 'number', description: 'How long to let the game run (3-30, default 8)' },
        actions: {
          type: 'array',
          description: 'Scripted input, each with `at` (ms after load). {type:"click", x, y} in game coordinates; '
            + '{type:"key", key:"E"|"Space"|"Enter"|"Escape"|"ArrowLeft"|…, holdMs?} (hold movement keys with holdMs); '
            + '{type:"type", text:"hello"} types characters. A frame is captured ~0.8s after each action.',
          items: { type: 'object' },
        },
      },
    };
  }

  async run(params = {}) {
    const s = this._scope.session();
    const res = await SmokeRunner.run({
      gameDir: s.dir,
      seconds: params.seconds,
      actions: params.actions,
      url: this._liveUrl(),
      screenshots: true,
      shotDir: path.join(s.dir, '.gamedata', 'smoke'),
    });
    return this._result(res, SmokeReport.format(res));
  }

  _liveUrl() {
    if (this._scope.kind !== GameKind.AI || !this._gatewayInfo || !this._gatewayInfo.baseUrl) return null;
    const conv = String(this._scope.conversationId == null ? '' : this._scope.conversationId).replace(/[^A-Za-z0-9_-]/g, '');
    return `${this._gatewayInfo.baseUrl}/api/ext/game-mode/play/${encodeURIComponent(conv)}/index.html?smoke=${Date.now()}`;
  }

  _result(res, rep) {
    const lastShot = [...(Array.isArray(res.shots) ? res.shots : [])].reverse().find((x) => x && x.png);
    const attach = !!lastShot && this._canSee();
    const out = {
      success: true,
      message: rep.message + (attach ? '\nThe final frame is attached as an image: look at it and describe what the player would see.' : ''),
      summary: rep.summary,
    };
    if (attach) {
      out.imageBase64 = lastShot.png.toString('base64');
      out.mimeType = 'image/png';
    }
    return out;
  }

  _canSee() {
    const chat = this._scope.chat;
    try {
      return !!(chat && typeof chat.visionAvailable === 'function' && chat.visionAvailable(this._modelRef || null));
    } catch (_) { return false; }
  }
}

module.exports = RunGameTool;
