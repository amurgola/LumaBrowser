class ImageQuantResolver {
  static resolve(entry, quantId) {
    const files = ImageQuantResolver._copyFiles(entry.files);
    const diffusion = files.diffusion;
    const quants = diffusion && Array.isArray(diffusion.quants) ? diffusion.quants : null;
    if (diffusion) delete diffusion.quants;
    if (!quants || !quantId) return { files };
    const quant = quants.find((q) => q && q.id === quantId);
    if (!quant) return { error: `Unknown quant "${quantId}" for model "${entry.id}".` };
    files.diffusion = { ...diffusion, file: quant.file, url: quant.url, approxBytes: quant.approxBytes };
    return { files };
  }

  static _copyFiles(files) {
    const out = {};
    for (const role of Object.keys(files)) out[role] = { ...files[role] };
    return out;
  }
}

module.exports = ImageQuantResolver;
