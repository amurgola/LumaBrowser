class ImageModelPicks {
  static JOBS = {
    image: { field: 'modelId', kind: 'generate' },
    edit: { field: 'editModelId', kind: 'edit' },
    video: { field: 'videoModelId', kind: 'video' },
  };

  static normalize(picks) {
    const out = {};
    for (const job of Object.keys(ImageModelPicks.JOBS)) {
      const id = picks && typeof picks[job] === 'string' ? picks[job].trim() : '';
      if (id) out[job] = id;
    }
    return out;
  }

  static over(defaults, picks) {
    const out = { ...(defaults || {}) };
    for (const [job, id] of Object.entries(ImageModelPicks.normalize(picks))) out[ImageModelPicks.JOBS[job].field] = id;
    return out;
  }

  static installedOnly(picks, installed) {
    const rows = Array.isArray(installed) ? installed : [];
    const out = {};
    for (const [job, id] of Object.entries(ImageModelPicks.normalize(picks))) {
      const kind = ImageModelPicks.JOBS[job].kind;
      if (rows.some((row) => row && row.id === id && row.kind === kind)) out[job] = id;
    }
    return out;
  }
}

module.exports = ImageModelPicks;
