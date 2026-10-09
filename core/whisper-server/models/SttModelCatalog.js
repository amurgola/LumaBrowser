const MediaModelCatalog = require('../../media-shared/MediaModelCatalog');

const MB = 1024 * 1024;

class SttModelCatalog extends MediaModelCatalog {
  static WHISPER_BASE_URL = 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main';
  static SHERPA_ASR_BASE_URL = 'https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models';
  static RECOMMENDED_ID = 'parakeet-tdt-0.6b-v3';

  static ENTRIES = [
    {
      id: 'parakeet-tdt-0.6b-v3',
      engine: 'sherpa',
      sherpaKind: 'nemo_transducer',
      archive: 'sherpa-onnx-nemo-parakeet-tdt-0.6b-v3-int8.tar.bz2',
      name: 'Parakeet v3 (NVIDIA, 0.6B int8)',
      description:
        'Most accurate fast option: 25 European languages with automatic detection, transcribes an utterance '
        + 'in a fraction of a second on CPU. Runs in the shared speech engine, no extra runtime.',
      sizeBytes: 465 * MB,
      languages: 'en + 24 European',
      license: 'CC-BY-4.0 (NVIDIA)',
      recommendedFor: 'default',
    },
    {
      id: 'qwen3-asr-0.6b',
      engine: 'sherpa',
      sherpaKind: 'qwen3_asr',
      archive: 'sherpa-onnx-qwen3-asr-0.6B-int8-2026-03-25.tar.bz2',
      name: 'Qwen3-ASR (0.6B int8)',
      description:
        '52 languages and dialects with the strongest open multilingual accuracy. About a second per utterance on CPU.',
      sizeBytes: 838 * MB,
      languages: 'multilingual (52)',
      license: 'Apache-2.0 (Alibaba Qwen)',
      recommendedFor: 'multilingual',
    },
    {
      id: 'whisper-base-en',
      engine: 'whisper',
      file: 'ggml-base.en.bin',
      name: 'Whisper Base (English)',
      description: 'Tiny + fast, English only. Good enough for clear speech on any CPU. Needs the whisper.cpp runtime.',
      sizeBytes: 148 * MB,
      languages: 'en',
      license: 'MIT (OpenAI)',
      recommendedFor: 'cpu',
    },
    {
      id: 'whisper-small',
      engine: 'whisper',
      file: 'ggml-small.bin',
      name: 'Whisper Small (multilingual)',
      description: 'Solid accuracy in ~100 languages, quick on CPU. Needs the whisper.cpp runtime.',
      sizeBytes: 488 * MB,
      languages: 'multilingual',
      license: 'MIT (OpenAI)',
      recommendedFor: 'whisper',
    },
    {
      id: 'whisper-large-v3-turbo',
      engine: 'whisper',
      file: 'ggml-large-v3-turbo.bin',
      name: 'Whisper Large v3 Turbo',
      description: 'Whisper’s best accuracy; well under a second per utterance on a GPU. Needs the whisper.cpp runtime.',
      sizeBytes: 1620 * MB,
      languages: 'multilingual',
      license: 'MIT (OpenAI)',
      recommendedFor: 'gpu',
    },
  ];

  constructor() {
    super(SttModelCatalog.ENTRIES);
  }

  downloadUrl(entry) {
    if (entry.engine === 'sherpa') return `${SttModelCatalog.SHERPA_ASR_BASE_URL}/${entry.archive}`;
    return `${SttModelCatalog.WHISPER_BASE_URL}/${entry.file}`;
  }

  recommendedId() {
    return SttModelCatalog.RECOMMENDED_ID;
  }
}

module.exports = SttModelCatalog;
