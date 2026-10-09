const path = require('path');

class HfRepoRecipes {
  static HOST = /(^|\.)huggingface\.co$/i;
  static FILE_URL_SEGMENTS = Object.freeze(['resolve', 'blob']);
  static COMPATIBLE_RUNTIMES = Object.freeze(['sd-cpp-cuda12', 'sd-cpp-vulkan', 'sd-cpp-cpu']);

  static parseRepoUrl(url) {
    if (!url || typeof url !== 'string') return null;
    let parsed;
    try { parsed = new URL(url.trim()); } catch (_) { return null; }
    if (!HfRepoRecipes.HOST.test(parsed.hostname)) return null;
    const parts = parsed.pathname.split('/').filter(Boolean);
    if (parts.length < 2 || parts.some((p) => HfRepoRecipes.FILE_URL_SEGMENTS.includes(p))) return null;
    return { id: `${parts[0]}/${parts[1]}` };
  }

  static resolve(repoId, rfilenames, catalog) {
    if (HfRepoRecipes._isAnimaRepo(repoId, rfilenames)) return HfRepoRecipes.resolveAnima(repoId, rfilenames, catalog);
    return {
      error: `No auto-download recipe for "${repoId}" yet. For a single-file model, use `
        + '"Import custom model" with the direct .safetensors / .gguf URL instead.',
    };
  }

  static resolveAnima(repoId, rfilenames, catalog) {
    const diffusion = HfRepoRecipes.pickNewestAnimaBase(rfilenames.filter((f) => /diffusion_models\//i.test(f) && /\.safetensors$/i.test(f)));
    if (!diffusion) return { error: `Repo "${repoId}" has no Anima diffusion .safetensors under split_files/diffusion_models/.` };
    const llm = rfilenames.find((f) => /text_encoders\/.*qwen.*\.safetensors$/i.test(f)) || rfilenames.find((f) => /text_encoders\/.*\.safetensors$/i.test(f));
    const vae = rfilenames.find((f) => /vae\/.*qwen.*vae.*\.safetensors$/i.test(f)) || rfilenames.find((f) => /vae\/.*\.safetensors$/i.test(f));
    if (!llm) return { error: `Repo "${repoId}" is missing the Qwen3 text encoder under split_files/text_encoders/.` };
    if (!vae) return { error: `Repo "${repoId}" is missing the VAE under split_files/vae/.` };
    return { entry: HfRepoRecipes._animaEntry(repoId, { diffusion, vae, llm }, (catalog && catalog.getById('anima')) || {}) };
  }

  static pickNewestAnimaBase(files) {
    if (!files.length) return null;
    const scored = files.map((f) => {
      const base = path.basename(f);
      const m = /anima-base-v(\d+)\.(\d+)/i.exec(base);
      return { f, base, rank: m ? Number(m[1]) * 1000 + Number(m[2]) : -1 };
    });
    scored.sort((a, b) => (b.rank - a.rank) || b.base.localeCompare(a.base));
    return scored[0].f;
  }

  static resolveUrl(repoId, rfilename) {
    return `https://huggingface.co/${repoId}/resolve/main/${rfilename.split('/').map(encodeURIComponent).join('/')}?download=true`;
  }

  static _isAnimaRepo(repoId, rfilenames) {
    return /^circlestone-labs\/Anima$/i.test(repoId) || rfilenames.some((f) => /(^|\/)anima[-_].*\.safetensors$/i.test(f));
  }

  static _animaEntry(repoId, picks, cat) {
    const file = (rf, extra) => ({ role: extra.role, file: path.basename(rf), url: HfRepoRecipes.resolveUrl(repoId, rf), ...extra });
    return {
      id: 'anima',
      label: cat.label || 'Anima (non-commercial)',
      family: cat.family || 'anima',
      kind: cat.kind || 'generate',
      files: {
        diffusion: file(picks.diffusion, { role: 'diffusion', loaderFlag: '--diffusion-model' }),
        vae: file(picks.vae, { role: 'vae' }),
        llm: file(picks.llm, { role: 'llm' }),
      },
      defaults: cat.defaults || null,
      minVramBytes: cat.minVramBytes || null,
      launchArgs: cat.launchArgs || [],
      licenseNote: cat.licenseNote || null,
      protocol: 'sd-cpp-http',
      compatibleRuntimes: cat.compatibleRuntimes || [...HfRepoRecipes.COMPATIBLE_RUNTIMES],
      resolvedNote: `Resolved newest base: ${path.basename(picks.diffusion)}`,
    };
  }
}

module.exports = HfRepoRecipes;
