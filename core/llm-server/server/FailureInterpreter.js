class FailureInterpreter {
  static RULES = [
    {
      kind: 'oom',
      re: /out of memory|OutOfMemory|ErrorOutOfDeviceMemory|cudaMalloc|failed to allocate|unable to allocate|allocation failed|not enough (?:memory|space)/i,
      title: 'The GPU ran out of memory while loading',
      advice: 'Another app may be holding VRAM, or the fit estimate was too optimistic for the moment. '
        + 'Close other GPU-heavy apps and start again, or lower the context length or KV precision in Defaults. '
        + 'The fit test finds the largest combination that really fits.',
    },
    {
      kind: 'unknown-flag',
      re: /unknown (?:argument|option|flag)|unrecognized (?:argument|option)|invalid (?:argument|option|parameter)/i,
      title: 'The runtime does not understand a launch flag',
      advice: 'The installed runtime build is older or newer than this launch configuration expects. '
        + 'Flags the app itself adds are remembered as unsupported for this build and dropped on the next start. '
        + 'If you typed the flag into the model\'s extra launch flags, remove it there; '
        + 'otherwise update or reinstall the runtime in the Inference Runtimes card, then start again.',
    },
    {
      kind: 'openvino-device',
      re: /ov::Exception|Incompatible OpenCL runtime|Patched Mesa libclc|Exception from src[\\/](?:inference|plugins)|GGML_OPENVINO_DEVICE|OpenVINO.*(?:not (?:available|registered|found)|unavailable|failed to (?:load|create))|(?:GPU|NPU)(?:\.\d+)? (?:device )?is not (?:available|registered)/i,
      title: 'OpenVINO could not open the device it was asked for',
      advice: 'On Linux the Intel GPU needs Intel\'s OpenCL compute runtime (intel-opencl-icd on Ubuntu, intel-compute-runtime on Arch; Mesa\'s rusticl does not work), and the NPU needs the Intel NPU user-space driver (intel-level-zero-npu) plus libze1. '
        + 'Panther Lake needs compute-runtime 26.18 or newer. Check with clinfo -l, then start again; '
        + 'or pick CPU as the OpenVINO device in Defaults, or the Vulkan runtime, to get the model up now.',
    },
    {
      kind: 'bad-model',
      re: /gguf_init_from_file|invalid magic|failed to load model|error loading model|unknown (?:model )?architecture|failed to read tensor|corrupt/i,
      title: 'The model file failed to load',
      advice: 'The file may be incomplete, damaged, or an unsupported format for this runtime. '
        + 'Re-download the model, or pick a different one in Defaults.',
    },
    {
      kind: 'driver',
      re: /DLL load failed|LoadLibrary|error while loading shared libraries|cannot open shared object file|CUDA driver version|no CUDA-capable device|cudaGetDeviceCount|failed to initialize CUDA|CUDA error: (?:unknown|initialization)|vk::|vulkan.*(?:failed|not found)/i,
      title: 'A GPU library or driver problem stopped the runtime',
      advice: 'Check the CUDA card under Advanced > Server Info; a driver update or a reboot usually fixes this. '
        + 'The Vulkan or CPU runtime works without CUDA if you need the model up right now.',
    },
  ];

  static UNKNOWN_FLAG_RE = /(?:invalid|unknown|unrecognized|unrecognised)\s+(?:argument|option|flag|parameter)s?:?\s*['"`]?(--?[A-Za-z][\w.-]*)/i;

  static interpret(text) {
    const s = FailureInterpreter._toText(text);
    if (!s) return null;
    const rule = FailureInterpreter.RULES.find((r) => r.re.test(s));
    return rule ? { kind: rule.kind, title: rule.title, advice: rule.advice } : null;
  }

  static extractUnknownFlag(text) {
    const s = FailureInterpreter._toText(text);
    if (!s) return null;
    const m = s.match(FailureInterpreter.UNKNOWN_FLAG_RE);
    return m ? m[1] : null;
  }

  static _toText(value) {
    return String(value || '');
  }
}

module.exports = FailureInterpreter;
