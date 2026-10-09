const CastResolver = require('../../world/CastResolver');
const SceneLocator = require('../../world/SceneLocator');
const CharacterArt = require('../../world/CharacterArt');
const RoleplayIds = require('../../world/RoleplayIds');
const ProseCues = require('../../prompts/ProseCues');
const PoseCatalog = require('../../prompts/PoseCatalog');
const ImagePrompt = require('../../prompts/ImagePrompt');
const PaintedBeatPrompt = require('../../prompts/PaintedBeatPrompt');
const RenderDimensions = require('../../images/RenderDimensions');
const RoleplayEnv = require('../../images/RoleplayEnv');
const BeatKind = require('../../images/BeatKind');

class ReactionPlan {
  constructor(data, content, directorShot) {
    this.data = data;
    this.content = content;
    this.directorShot = directorShot;
    this._resolveCast();
    this._resolveCanvas();
    this._resolveBeat();
  }

  _resolveCast() {
    const all = CastResolver.orderByFocus(CastResolver.forMoment(this.data, this.content), this.directorShot);
    this.momentEntries = all.slice(0, RoleplayEnv.castMax());
    this.present = this.momentEntries.map((entry) => entry.char);
    for (const c of this.present) { if (c && !Number.isFinite(c.seed)) c.seed = RoleplayIds.seed(); }
    this.soloEntry = this.momentEntries.length === 1 ? this.momentEntries[0] : null;
    const seedChar = this.present.find((c) => Number.isFinite(c.seed));
    this.seed = seedChar ? seedChar.seed : undefined;
  }

  _resolveCanvas() {
    const data = this.data;
    this.scene = SceneLocator.active(data);
    this.sceneId = (data.currentState && data.currentState.sceneId) || data.activeSceneId || (this.scene && this.scene.id) || null;
    this.sceneBg = this.scene && this.scene.bg && this.scene.bg.b64 ? this.scene.bg.b64 : null;
    this.shot = ProseCues.shotType(this.content);
    const dims = RenderDimensions.reaction(data, this.shot);
    this.width = dims.width;
    this.height = dims.height;
    this.pose = PoseCatalog.resolve(this.directorShot, this.content);
    this.sceneMode = RoleplayEnv.sceneMode();
  }

  _resolveBeat() {
    this.paintedBeat = BeatKind.isPainted(this.directorShot);
    this.dynamicBeat = BeatKind.isDynamic(this.directorShot);
    this.soloPaintedBeat = this.paintedBeat && this.momentEntries.length === 1;
    this.closeUp = !!(this.directorShot && this.directorShot.framing === 'close');
    this.animaPrompt = ImagePrompt.build(this.data, this.content);
    this.platePrompt = this.paintedBeat
      ? PaintedBeatPrompt.build(this.data, this.animaPrompt, this.directorShot, this.momentEntries)
      : this.animaPrompt;
    this.compChar = this.soloEntry ? CharacterArt.bodyRefForState(this.soloEntry.char, this.soloEntry.state) : null;
  }

  compositeEntries() {
    return (this.sceneMode === 'composite' && this.sceneBg && !this.paintedBeat) ? this.momentEntries : [];
  }

  bodyRefs() {
    return this.momentEntries.map((e) => CharacterArt.bodyRefForState(e.char, e.state)).filter(Boolean).slice(0, 2);
  }

  figureHeight(group) {
    let figH = group ? Math.min(this.pose.figH, 0.82) : this.pose.figH;
    if (this.closeUp) figH = Math.min(0.98, figH + (group ? 0.04 : 0.06));
    return figH;
  }
}

module.exports = ReactionPlan;
