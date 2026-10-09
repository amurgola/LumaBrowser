const ModelFamilies = require('../ModelFamilies');
const DraftBranchCost = require('./DraftBranchCost');

class SpeculationPlan {
  static MTP_DRAFT_N_MAX = 3;

  static IK_MTP_DRAFT_N_MAX = 3;

  static NGRAM_MOD_N_MATCH = 40;

  static NGRAM_MOD_N_MIN = 0;

  static NGRAM_MOD_N_MAX = 16;

  static NGRAM_SOLO_N_MAX = 4;

  static DRAFT_CACHE_TYPE = 'q4_0';

  static resolve({ files, flags, overrides }) {
    const plan = { mtpDetached: !!files.mtpHeadPath };
    SpeculationPlan._resolveFamilyDrafter(plan, files, flags, overrides);
    SpeculationPlan._resolveMtp(plan, files, flags);
    SpeculationPlan._resolveNgram(plan, files, flags, overrides);
    SpeculationPlan._resolveBudget(plan, files);
    SpeculationPlan._resolveDraftCache(plan, flags, overrides);
    return plan;
  }

  static _resolveFamilyDrafter(plan, files, flags, overrides) {
    plan.specDrafterOff = !!overrides.noSpecDrafter;
    plan.dflashEnabled = !!files.drafterPath && flags.specDrafterFlags && !plan.specDrafterOff
      && !!(ModelFamilies.speculativeArgs(files.family, {
        drafterPath: files.drafterPath, flagsSupported: true, gpuOffload: false, dialect: flags.specDialect,
      }));
  }

  static _resolveMtp(plan, files, flags) {
    plan.mtpDetachedUnsupportedByDialect = plan.mtpDetached && flags.specDialect === 'ik';
    plan.mtpEnabled = (plan.mtpDetached ? flags.specDrafterFlags : flags.mtpFlags)
      && files.mtpCapable && !plan.dflashEnabled && !plan.mtpDetachedUnsupportedByDialect;
    plan.mtpDraftNMax = flags.specDialect === 'ik'
      ? SpeculationPlan.IK_MTP_DRAFT_N_MAX
      : (ModelFamilies.mtpDraftNMax(files.family) || SpeculationPlan.MTP_DRAFT_N_MAX);
  }

  static _resolveNgram(plan, files, flags, overrides) {
    plan.ngramSpecOff = !!overrides.noNgramSpec;
    plan.ngramSpecEnabled = !plan.ngramSpecOff && !plan.mtpEnabled && !plan.dflashEnabled
      && flags.specDialect === 'mainline' && flags.specType
      && ModelFamilies.ngramSpec(files.family);
  }

  static _resolveBudget(plan, files) {
    plan.specDrafterBytes = plan.dflashEnabled ? files.drafterBytes : 0;
    plan.mtpBranchHeadBytes = (plan.mtpEnabled && plan.mtpDetached) ? files.mtpHeadBytes : 0;
    plan.mtpBranchBytes = plan.mtpEnabled ? plan.mtpBranchHeadBytes + DraftBranchCost.MTP_BRANCH_FIXED : 0;
  }

  static _resolveDraftCache(plan, flags, overrides) {
    const requested = !!overrides.quantizeDraftCache;
    plan.draftCacheType = requested && (plan.mtpEnabled || plan.dflashEnabled) && flags.draftCacheFlags && flags.flashAttn
      ? SpeculationPlan.DRAFT_CACHE_TYPE
      : null;
  }
}

module.exports = SpeculationPlan;
