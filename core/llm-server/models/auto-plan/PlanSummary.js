const ImageModelPicker = require('../../../shared/ImageModelPicker');
const RecommenderRationale = require('../RecommenderRationale');
const AutoPlanRanking = require('./AutoPlanRanking');

const gb = RecommenderRationale.gb;

class PlanSummary {
  static build(plan) {
    return [
      PlanSummary._chatLine(plan.llm),
      PlanSummary._imageLine(plan),
      PlanSummary._placementLine(plan),
      PlanSummary._llmWarning(plan.llm),
      PlanSummary._imageOffloadLine(plan.image),
      PlanSummary._musicLine(plan),
      PlanSummary._ramPinLine(plan.ramPin),
    ].filter(Boolean);
  }

  static listPhrase(parts) {
    const items = (parts || []).filter(Boolean);
    if (items.length <= 1) return items[0] || '';
    return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
  }

  static combinedNeed({ image, machine, llmPick }) {
    if (!image || !machine.gpu) return null;
    const need = AutoPlanRanking.vramNeedOf(llmPick);
    if (need == null) return null;
    return need + image.minVramBytes + ImageModelPicker.IMAGE_HEADROOM;
  }

  static _chatLine(llm) {
    return `Chat model: ${llm.label} (${llm.quant}), ${llm.contextSize.toLocaleString()} token context.`;
  }

  static _imageLine({ image, wantImage }) {
    if (image) return `Image model: ${image.label}, about ${gb(image.approxTotalBytes)} to download.`;
    return wantImage ? 'No image model is available for this platform.' : null;
  }

  static _placementLine(plan) {
    const { placement, machine } = plan;
    const need = PlanSummary.combinedNeed(plan);
    const quoted = need != null && machine.vramTotal > 0;
    if (placement.kind === 'coexist') {
      const note = quoted ? ` (about ${gb(need)} of your ${gb(machine.vramTotal)})` : '';
      return `Both models fit in your graphics memory at the same time${note}.`;
    }
    if (placement.kind === 'singularity') return PlanSummary._swapLine(plan, quoted ? need : null);
    if (placement.kind === 'fcfs') {
      return 'The image model will stream from system RAM when both are loaded. Image generation will be slower.';
    }
    return null;
  }

  static _swapLine({ image, musicPooled, machine }, need) {
    const swapped = ['chat'];
    if (image) swapped.push('images');
    if (musicPooled) swapped.push('music');
    return `Your GPU holds one model at a time, so we will swap ${PlanSummary.listPhrase(swapped)} automatically. Swaps take a few seconds.`
      + (need != null ? ` Together they would need about ${gb(need)}, more than your ${gb(machine.vramTotal)}.` : '');
  }

  static _llmWarning(llm) {
    if (llm.warnId === 'cpu-only') {
      return 'No usable GPU was detected. Everything runs on the processor, so replies will be modest in speed.';
    }
    if (llm.warnId === 'partial-offload') {
      return 'The chat model is larger than your graphics memory and will run partly from system RAM.';
    }
    if (llm.cpuMoe) return 'This sparse model keeps its expert layers in system RAM and its always-on layers on the GPU.';
    return null;
  }

  static _imageOffloadLine(image) {
    if (!(image && image.offload)) return null;
    return 'The image model is larger than your graphics memory and will run in streaming mode, which is slower.';
  }

  static _musicLine({ music, wantMusic, musicSkippedReason, musicPooled }) {
    if (music) {
      return `Music model: ${music.label}, about ${gb(music.approxTotalBytes)} to download. `
        + (musicPooled
          ? 'It loads on demand, taking its turn on the shared card, and unloads again when you are done.'
          : 'It loads on demand and may wait for a free GPU while chat or images are busy.');
    }
    return wantMusic && musicSkippedReason ? `Music generation skipped: ${musicSkippedReason}` : null;
  }

  static _ramPinLine(ramPin) {
    if (!ramPin.recommended) return null;
    return 'Both models stay locked in system memory, so each swap takes a moment instead of a full reload.';
  }
}

module.exports = PlanSummary;
