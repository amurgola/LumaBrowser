export default class SetupQuestions {
  static QUESTIONS = {
    useCase: {
      label: 'What will you use it for?',
      options: [
        { value: 'chat', title: 'Chatting & Q&A', desc: 'Everyday questions, brainstorming, quick help.' },
        { value: 'development', title: 'Development', desc: 'Writing, explaining, and refactoring code.' },
        { value: 'documents', title: 'Documents & business', desc: 'Longer text, summaries, analysis.' },
      ],
    },
    tkPref: {
      label: 'Slowest speed you could tolerate?',
      options: [
        { value: 50, title: 'Snappy', desc: '~50 tokens/sec' },
        { value: 20, title: 'Balanced', desc: '~20 tokens/sec' },
        { value: 10, title: 'Patient', desc: '~10 tokens/sec' },
      ],
    },
    ctxPref: {
      label: 'How much conversation memory?',
      options: [
        { value: 'short', title: 'Short (~4K)', desc: 'Quick chats, fastest and lightest.' },
        { value: 'medium', title: 'Medium (~16K)', desc: 'A good general default.' },
        { value: 'long', title: 'Long (~48K+)', desc: 'Long documents and deep sessions.' },
      ],
    },
  };
}
