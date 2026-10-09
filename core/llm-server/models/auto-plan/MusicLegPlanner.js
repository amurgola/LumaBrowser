const PlacementLayout = require('../../../shared/runtime/PlacementLayout');
const RecommenderRationale = require('../RecommenderRationale');

const GB = 1024 * 1024 * 1024;

class MusicLegPlanner {
  static SOLO_NEED_BYTES = 34 * GB;

  static AR_STAGE_BYTES = 20 * GB;

  static DIT_STAGE_BYTES = 13 * GB;

  static plan({ wantMusic, musicModels, musicEligibility, machine }) {
    if (!wantMusic) return { music: null, skippedReason: null };
    const row = (musicModels || [])[0] || null;
    if (!row) return { music: null, skippedReason: 'No music model is available in the catalog.' };
    const needs = MusicLegPlanner._needsOf(row);
    const sorted = machine.cards.slice().sort((a, b) => b - a);
    if (!MusicLegPlanner._vramOk(machine.gpu, sorted, needs)) {
      return { music: null, skippedReason: MusicLegPlanner._vramReason(needs) };
    }
    if (musicEligibility && musicEligibility.wslReady === false) {
      return { music: null, skippedReason: 'Music generation on Windows runs inside WSL2. Install WSL2 and the NVIDIA driver with WSL support first.' };
    }
    return { music: MusicLegPlanner._leg(row, needs, sorted), skippedReason: null };
  }

  static pool({ music, hasImage, machine, placement }) {
    const card = machine.largestCudaCard;
    if (!(music && music.solo && machine.gpu && card)) return { placement, pooled: false };
    const poolOnThatCard = placement.kind === 'singularity' && placement.card === card.index;
    const singleCardBox = machine.cudaCards.length <= 1;
    if (!poolOnThatCard && !singleCardBox) return { placement, pooled: false };
    const members = hasImage ? ['llm', 'imageGenerate', 'music'] : ['llm', 'music'];
    return {
      placement: { kind: 'singularity', card: card.index, layout: PlacementLayout.singularityLayout(card.index, members) },
      pooled: true,
    };
  }

  static _needsOf(row) {
    return {
      solo: Number(row.minVramBytes) || MusicLegPlanner.SOLO_NEED_BYTES,
      ar: Number(row.arStageBytes) || MusicLegPlanner.AR_STAGE_BYTES,
      dit: Number(row.ditStageBytes) || MusicLegPlanner.DIT_STAGE_BYTES,
    };
  }

  static _vramOk(gpu, sortedCards, needs) {
    const first = sortedCards[0] || 0;
    const second = sortedCards[1] || 0;
    return gpu && (first >= needs.solo || (first >= needs.ar && second >= needs.dit));
  }

  static _vramReason(needs) {
    const gb = RecommenderRationale.gb;
    return `Music generation needs one GPU with about ${gb(needs.solo)} of memory, `
      + `or two NVIDIA GPUs with roughly ${gb(needs.ar)} and ${gb(needs.dit)}.`;
  }

  static _leg(row, needs, sortedCards) {
    return {
      modelId: row.id,
      label: row.label || row.id,
      runtimeId: 'sglang-omni',
      approxTotalBytes: Number(row.approxTotalBytes) || 0,
      minVramBytes: needs.solo,
      solo: (sortedCards[0] || 0) >= needs.solo,
    };
  }
}

module.exports = MusicLegPlanner;
