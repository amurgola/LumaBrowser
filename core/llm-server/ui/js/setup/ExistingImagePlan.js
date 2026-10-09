import ExistingLibraryView from './ExistingLibraryView.js';

export default class ExistingImagePlan {
  static choices(scan, plan) {
    if (!plan || !plan.image) return [];
    const models = ExistingLibraryView.modelsOf(scan);
    const budget = ExistingImagePlan._budget(plan.image);
    const roomy = !!(plan.placement && plan.placement.kind === 'singularity');
    return models.filter((m) => m && m.path && (roomy || !(budget > 0) || Number(m.bytes) <= budget));
  }

  static withExisting(plan, found) {
    if (!plan || !plan.image || !found) return plan;
    return {
      ...plan,
      summary: ExistingImagePlan._summaryWith(plan.summary, ExistingImagePlan._summaryLine(found)),
      image: {
        ...plan.image,
        found,
        label: found.name,
        planned: { label: plan.image.label, approxTotalBytes: plan.image.approxTotalBytes },
        approxTotalBytes: 0,
      },
    };
  }

  static _budget(image) {
    return Number(image.planned ? image.planned.approxTotalBytes : image.approxTotalBytes) || 0;
  }

  static _summaryLine(found) {
    return 'Image model: ' + found.name + (found.archLabel ? ' (' + found.archLabel + ')' : '')
      + ', linked from ' + (ExistingLibraryView.sourceLabel(found.source) || found.sourceLabel || 'your existing library')
      + '. No download.';
  }

  static _summaryWith(summary, line) {
    let replaced = false;
    const out = (summary || []).map((entry) => {
      if (!replaced && /^Image model:/.test(String(entry))) { replaced = true; return line; }
      return entry;
    });
    if (!replaced) out.push(line);
    return out;
  }
}
