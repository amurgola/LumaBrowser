const ImageModelPicker = require('../../shared/ImageModelPicker');
const ImageModelCatalog = require('../../image-server/models/ImageModelCatalog');
const AutoPlanMachine = require('./auto-plan/AutoPlanMachine');
const LlmTierPicker = require('./auto-plan/LlmTierPicker');
const ImagePlacementPlanner = require('./auto-plan/ImagePlacementPlanner');
const MusicLegPlanner = require('./auto-plan/MusicLegPlanner');
const LlmRecommendation = require('./auto-plan/LlmRecommendation');
const RamPinAdvice = require('./auto-plan/RamPinAdvice');
const PlanSummary = require('./auto-plan/PlanSummary');

class AutoPlanner {
  plan(args) {
    this._setupFromArgs(args);
    this._pickLlm();
    if (!this._llmPick) return this._nothingFits();
    this._pickImage();
    this._pickMusic();
    this._placeImage();
    this._poolMusic();
    this._adviseRamPin();
    return this._buildPlan();
  }

  _setupFromArgs(args) {
    this._args = { ...args, cpuMoeSupported: args.cpuMoeSupported === undefined ? true : args.cpuMoeSupported };
    this._machine = AutoPlanMachine.describe(args.hw, args.devices);
  }

  _pickLlm() {
    const { llmModels, hw, cpuMoeSupported } = this._args;
    this._llmPick = LlmTierPicker.pick(llmModels, this._machine, hw, { cpuMoeSupported });
  }

  _nothingFits() {
    return {
      llm: null, image: null, music: null, placement: { kind: 'none' },
      tier: this._machine.tier, summary: ['No model in the catalog fits this machine.'],
    };
  }

  _pickImage() {
    this._image = null;
    if (!this._args.wantImage) return;
    const picked = ImageModelPicker.pickImageModel(this._args.imageModels || [], {
      cardBudgetBytes: this._machine.gpu ? ImageModelPicker.cardBudgetBytesFromHw(this._args.hw) : 0,
    });
    if (!picked) return;
    this._image = {
      modelId: picked.model.id,
      label: picked.model.label || picked.model.id,
      approxTotalBytes: ImageModelCatalog.totalApproxBytes(picked.model),
      minVramBytes: Number(picked.model.minVramBytes) || 0,
      offload: picked.offload,
    };
  }

  _pickMusic() {
    const { wantMusic, musicModels, musicEligibility } = this._args;
    const leg = MusicLegPlanner.plan({ wantMusic, musicModels, musicEligibility, machine: this._machine });
    this._music = leg.music;
    this._musicSkippedReason = leg.skippedReason;
  }

  _placeImage() {
    const planner = new ImagePlacementPlanner({
      machine: this._machine,
      llmModels: this._args.llmModels,
      image: this._image,
      cpuMoeSupported: this._args.cpuMoeSupported,
    });
    const decided = planner.decide(this._llmPick);
    this._llmPick = decided.llmPick;
    this._placement = decided.placement;
  }

  _poolMusic() {
    const pooled = MusicLegPlanner.pool({
      music: this._music, hasImage: !!this._image, machine: this._machine, placement: this._placement,
    });
    this._placement = pooled.placement;
    this._musicPooled = pooled.pooled;
  }

  _adviseRamPin() {
    this._ramPin = RamPinAdvice.advise({
      placement: this._placement, llmPick: this._llmPick, image: this._image, ramTotal: this._machine.ramTotal,
    });
  }

  _buildPlan() {
    const llm = LlmRecommendation.build(this._llmPick, this._args.hw);
    const summary = PlanSummary.build({
      llm,
      llmPick: this._llmPick,
      image: this._image,
      wantImage: this._args.wantImage,
      music: this._music,
      wantMusic: this._args.wantMusic,
      musicSkippedReason: this._musicSkippedReason,
      musicPooled: this._musicPooled,
      placement: this._placement,
      ramPin: this._ramPin,
      machine: this._machine,
    });
    return {
      llm,
      image: this._image,
      music: this._music,
      musicSkippedReason: this._musicSkippedReason,
      placement: this._placement,
      tier: this._machine.tier,
      summary,
      ramPin: this._ramPin,
    };
  }
}

module.exports = AutoPlanner;
