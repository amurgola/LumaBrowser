module.exports = {
  id: 'chatterbox-voice',
  name: 'Chatterbox Voice Cloning',
  version: '1.0.0',
  description:
    'Clone a voice from a short recording and have voice conversations and '
    + 'read-aloud speak with it. Adds Resemble AI’s open Chatterbox models '
    + '(MIT) running on the audio.cpp engine (Apache-2.0, GPU or CPU) as an '
    + 'extra engine in the chat’s voice picker, plus a "Voice cloning" tab in '
    + 'the LLM Setup area to manage voices.',

  private: true,
  distributable: true,

  dependencies: {},

  main: './main.js',

  setupTab: {
    id: 'chatterbox-voice',
    label: 'Voice cloning',
    file: './setup-ui.js',
    assets: ['./setup-ui.css'],
  },
};
