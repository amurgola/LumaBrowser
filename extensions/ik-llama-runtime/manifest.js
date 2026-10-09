module.exports = {
  id: 'ik-llama-runtime',
  name: 'ik_llama.cpp Runtime',
  version: '1.0.0',
  description:
    "Adds ikawrakow's ik_llama.cpp fork as optional LLM runtimes (CUDA 12, "
    + 'CUDA 13, Vulkan, CPU). ik_llama is the only server that loads its own '
    + 'IQ*_K / IQ*_KT / *_R4 / *_R8 quantizations and carries CPU-side MoE '
    + 'kernels tuned for large mixture-of-experts models. Binaries come from '
    + "Thireus's automated build feed (github.com/Thireus/ik_llama.cpp), "
    + 'matched to this CPU\'s instruction set; a self-built copy can be '
    + 'registered with Locate instead.',

  private: true,
  distributable: true,

  dependencies: {},

  main: './main.js',
};
