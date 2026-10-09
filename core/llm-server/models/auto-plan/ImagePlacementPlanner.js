const HotswapRamGate = require('../../../shared/runtime/HotswapRamGate');
const PlacementLayout = require('../../../shared/runtime/PlacementLayout');
const ImageModelPicker = require('../../../shared/ImageModelPicker');
const AutoPlanRanking = require('./AutoPlanRanking');
const CoexistencePicker = require('./CoexistencePicker');
const LlmTierPicker = require('./LlmTierPicker');

const R = AutoPlanRanking;

class ImagePlacementPlanner {
  constructor({ machine, llmModels, image, cpuMoeSupported = true }) {
    this._machine = machine;
    this._llmModels = llmModels;
    this._image = image;
    this._cpuMoeSupported = cpuMoeSupported;
  }

  decide(llmPick) {
    const none = { llmPick, placement: ImagePlacementPlanner.unplaced('none') };
    if (!this._image || !this._machine.gpu) return none;
    this._resolveImageNeed();
    const llmVramNeed = R.vramNeedOf(llmPick);
    if (llmVramNeed == null) return { llmPick, placement: ImagePlacementPlanner.unplaced('fcfs') };
    if (CoexistencePicker.coexists(this._machine.cards, llmVramNeed, this._imgNeed)) {
      return { llmPick, placement: ImagePlacementPlanner.unplaced('coexist') };
    }
    return this._tradeOff(llmPick);
  }

  _resolveImageNeed() {
    this._imgNeed = this._image.minVramBytes + ImageModelPicker.IMAGE_HEADROOM;
    this._imgPoolBytes = this._image.approxTotalBytes;
  }

  _tradeOff(llmPick) {
    this._resolveShrinkFloor(llmPick);
    const bestResident = this._bestResident(llmPick.mode === 'gpu');
    const bestMoe = this._cpuMoeSupported ? this._bestMoe() : null;
    const chosen = ImagePlacementPlanner._preferred(bestResident, bestMoe);
    if (!chosen) return { llmPick, placement: ImagePlacementPlanner.unplaced('fcfs') };
    return { llmPick: chosen.pick, placement: this._placementFor(chosen.kind) };
  }

  _resolveShrinkFloor(llmPick) {
    const original = R.tierOf(llmPick);
    this._shrinkFloor = Math.min(original, Math.max(R.TIER_RANK.mid, original - 1));
  }

  _bestResident(gpuMode) {
    const { cards, vramTotal, largestCardBytes } = this._machine;
    const swap = gpuMode ? LlmTierPicker.fullVram(this._llmModels, largestCardBytes) : null;
    return ImagePlacementPlanner._best([
      { kind: 'coexist', pick: gpuMode ? this._floored(CoexistencePicker.residentPick(this._llmModels, cards, vramTotal, this._imgNeed)) : null },
      { kind: 'singularity', pick: this._swapOk(swap) ? swap : null },
    ]);
  }

  _bestMoe() {
    const { cards, vramTotal, ramUsable, largestCardBytes } = this._machine;
    const swap = LlmTierPicker.moeOffload(this._llmModels, largestCardBytes, ramUsable);
    return ImagePlacementPlanner._best([
      { kind: 'coexist', pick: this._floored(CoexistencePicker.moePick(this._llmModels, cards, vramTotal, ramUsable, this._imgNeed)) },
      { kind: 'singularity', pick: this._swapOk(swap) ? swap : null },
    ]);
  }

  _floored(pick) {
    return pick && R.tierOf(pick) >= this._shrinkFloor ? pick : null;
  }

  _swapOk(pick) {
    if (!(pick && this._machine.largestCudaCard)) return false;
    return HotswapRamGate.evaluate({
      ramTotalBytes: this._machine.ramTotal,
      poolBytes: [pick.weightsBytes, this._imgPoolBytes],
      inFlightCopy: pick.mode !== 'moe-cpu',
    }).viable;
  }

  _placementFor(kind) {
    if (kind !== 'singularity') return ImagePlacementPlanner.unplaced('coexist');
    const card = this._machine.largestCudaCard.index;
    return { kind: 'singularity', card, layout: PlacementLayout.singularityLayout(card) };
  }

  static unplaced(kind) {
    return { kind, card: null, layout: null };
  }

  static _best(candidates) {
    return candidates.filter((c) => c.pick)
      .reduce((top, c) => (!top || R.modelScore(c.pick) > R.modelScore(top.pick) ? c : top), null);
  }

  static _preferred(bestResident, bestMoe) {
    if (!bestMoe) return bestResident;
    if (!bestResident) return bestMoe;
    const residentTier = R.tierOf(bestResident.pick);
    return residentTier < R.TIER_RANK.large && R.tierOf(bestMoe.pick) > residentTier ? bestMoe : bestResident;
  }
}


module.exports = ImagePlacementPlanner;
