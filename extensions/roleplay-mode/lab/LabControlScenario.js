class LabControlScenario {
  static NAME = 'control';

  static PREMISE = 'A weekday morning in a mid-sized city, late spring. The player walks to work through the usual '
    + 'crowd, picks up a coffee and rides the lift up to an office where nothing much is going on.';

  static TURNS = [
    'I wait at the crosswalk next to a stranger in a grey suit. The light turns red, then green, and I walk past him.',
    'Dana cuts through the crowd and falls into step beside me. "Morning. I am dying for a coffee."',
    'At the cafe Dana orders a blood orange juice and I get a flat white. Marco behind the counter hands me the cup.',
    'Dana says she is sick of waiting for the quarterly numbers. I ask her what the hold-up is.',
    'In the lobby Theo from accounts shakes my hand and asks about the weekend.',
    'Dana gives Theo a quick hug; they used to share a desk. I hold the lift door for both of them.',
    'Upstairs I drop my bag at my desk and ask Theo whether the meeting at ten is still on.',
    'Dana kills time scrolling her phone while the coffee machine runs. I ask her about the new project lead.',
  ];

  static build() {
    return {
      name: LabControlScenario.NAME,
      data: LabControlScenario.data(),
      turns: LabControlScenario.TURNS.slice(),
      facts: [],
      judges: [],
      expectNoGrounding: true,
    };
  }

  static data() {
    const c = (id, name, seed, description, appearance, outfit, profile) => ({
      id, name, seed, description, appearance, currentOutfitDesc: outfit, outfits: [], art: null, profile,
      chronicle: { arc: '', beats: [] }, state: { present: true },
    });
    return {
      version: 2,
      scenario: LabControlScenario.PREMISE,
      tone: 'light, observant, everyday; small talk with some warmth',
      lengthMode: 'balanced',
      protagonist: { name: 'Rook', pronouns: 'they/them', appearance: 'an office worker in a light jacket', persona: 'easygoing, curious about people' },
      characters: [
        c('dana', 'Dana', 51, 'a colleague in her thirties, quick and funny, always running a little late',
          'medium height, curly brown hair, round glasses', 'blazer, jeans, white trainers',
          { voice: 'fast, wry; "Don\'t get me started."', wants: 'a promotion', hides: 'she has a job interview elsewhere', tells: ['pushes her glasses up'], bonds: { user: 'friendly' } }),
        c('theo', 'Theo', 52, 'a man from accounts in his forties, careful and polite',
          'neat beard, pressed shirt', 'shirt and tie, chinos, loafers',
          { voice: 'measured, a little formal', wants: 'the numbers to add up', hides: '', tells: ['straightens his tie'], bonds: { user: 'cordial' } }),
        c('marco', 'Marco', 53, 'the barista at the corner cafe, cheerful, remembers everyone\'s order',
          'tall, tattooed forearms, apron', 'black t-shirt, apron',
          { voice: 'chatty', wants: 'a good tip jar', hides: '', tells: ['drums on the counter'], bonds: { user: 'friendly' } }),
      ],
      scenes: [{ id: 'street', name: 'the street', description: 'a busy downtown crossing, a corner cafe, an office lobby with lifts', bg: null }],
      activeSceneId: 'street',
      currentState: { sceneId: 'street', characters: [] },
      story: {
        turn: 0, clock: { day: 1, timeOfDay: 'morning', weather: 'mild, sunny' }, summary: '', summaryTurn: 0,
        ledger: [], threads: [{ text: 'the delayed quarterly numbers', open: true, turn: 0 }],
      },
      options: { autoImage: false, sceneBackground: false, autoAvatarArt: false, prosePolish: false },
      images: {},
    };
  }

  static canned() {
    return {
      stage: JSON.stringify({
        newCharacters: [], present: [{ name: 'Dana', present: true, emotion: 'cheerful', outfit: 'blazer, jeans, white trainers', outfitChanged: false }],
        events: [], clock: { advance: 'none' }, threads: { opened: [], closed: [] },
      }),
      profile: '{}', consolidate: '{}', default: '{}',
    };
  }
}

module.exports = LabControlScenario;
