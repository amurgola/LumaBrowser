const MediaModelCatalog = require('../../media-shared/MediaModelCatalog');

const MB = 1024 * 1024;

class TtsModelCatalog extends MediaModelCatalog {
  static RELEASE_BASE_URL = 'https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models';
  static KYUTAI_VOICES_BASE_URL = 'https://huggingface.co/kyutai/tts-voices/resolve/main';

  static POCKET_NUM_STEPS = 2;

  static KOKORO_MIN_THREADS = 8;
  static KOKORO_RECOMMENDED_ID = 'kokoro-int8-multi-lang-v1_1';
  static POCKET_RECOMMENDED_ID = 'pocket-tts-int8';

  static POCKET_VOICE_SET = [
    { file: 'alba.wav', name: 'Alba (female, Scottish)', source: 'alba-mackenna/casual.wav', license: 'CC-BY-4.0 (Alba MacKenna)' },
    { file: 'bill.wav', name: 'Bill (male)', source: 'voice-zero/bill_boerst.wav', license: 'CC0' },
    { file: 'caro.wav', name: 'Caro (female)', source: 'voice-zero/caro_davy.wav', license: 'CC0' },
    { file: 'peter.wav', name: 'Peter (male)', source: 'voice-zero/peter_yearsley.wav', license: 'CC0' },
    { file: 'stuart.wav', name: 'Stuart (male)', source: 'voice-zero/stuart_bell.wav', license: 'CC0' },
  ];

  static ENTRIES = [
    {
      id: 'pocket-tts-int8',
      name: 'Pocket TTS (100M, int8)',
      description:
        'Fastest natural voice: speaks within about half a second on a 4-core CPU and keeps ahead of realtime. '
        + 'English, French, German, Spanish, Portuguese, Italian. Five bundled voices; each is a short reference clip.',
      archive: 'sherpa-onnx-pocket-tts-int8-2026-01-26.tar.bz2',
      sizeBytes: 94 * MB,
      engine: 'pocket',
      license: 'CC-BY-4.0 (Kyutai)',
      defaultSid: 0,
      recommendedFor: 'cpu',
      quality: 'fast',
      voices: TtsModelCatalog.POCKET_VOICE_SET,
    },
    {
      id: 'kokoro-int8-multi-lang-v1_1',
      name: 'Kokoro (82M, int8)',
      description:
        'Good quality with 100+ voices across 9 languages. Needs a reasonably fast CPU (about 0.6x realtime at 12 threads).',
      archive: 'kokoro-int8-multi-lang-v1_1.tar.bz2',
      sizeBytes: 320 * MB,
      engine: 'kokoro',
      license: 'Apache-2.0',
      defaultSid: 0,
      recommendedFor: 'default',
      quality: 'medium',
    },
    {
      id: 'kokoro-en-v0_19',
      name: 'Kokoro English (82M, v0.19)',
      description:
        'Clearest English pronunciation: this release was trained on the exact phonemizer the local engine uses. 11 voices, English only, full precision (bigger download, roughly realtime on a fast CPU).',
      archive: 'kokoro-en-v0_19.tar.bz2',
      sizeBytes: 330 * MB,
      engine: 'kokoro',
      license: 'Apache-2.0',
      defaultSid: 0,
      quality: 'high',
    },
    {
      id: 'vits-piper-en_US-libritts_r-medium',
      name: 'Piper LibriTTS-R (English, fast)',
      description:
        'Near-instant synthesis on any CPU (about 0.05x realtime). English only, hundreds of speakers. The low-latency fallback.',
      archive: 'vits-piper-en_US-libritts_r-medium.tar.bz2',
      sizeBytes: 77 * MB,
      engine: 'vits',
      license: 'MIT engine / CC BY 4.0 voice data',
      defaultSid: 0,
      recommendedFor: 'cpu',
      quality: 'low',
    },
  ];

  constructor() {
    super(TtsModelCatalog.ENTRIES);
  }

  downloadUrl(entry) {
    return `${TtsModelCatalog.RELEASE_BASE_URL}/${entry.archive}`;
  }

  recommendedId(numThreads) {
    return Number(numThreads) >= TtsModelCatalog.KOKORO_MIN_THREADS
      ? TtsModelCatalog.KOKORO_RECOMMENDED_ID
      : TtsModelCatalog.POCKET_RECOMMENDED_ID;
  }

  pocketVoiceUrl(voice) {
    return `${TtsModelCatalog.KYUTAI_VOICES_BASE_URL}/${voice.source}`;
  }
}

module.exports = TtsModelCatalog;
