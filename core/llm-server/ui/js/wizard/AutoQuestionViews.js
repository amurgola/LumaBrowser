import Dom from '../dom/Dom.js';
import ChoiceCard from './ChoiceCard.js';

export default class AutoQuestionViews {
  static image(w, body) {
    const A = w.state.auto;
    body.appendChild(Dom.el('div', 'wz-hero',
      '<h2>Do you also want image generation?</h2>'
      + '<p class="wz-dim">Your chat model is picked automatically. Image '
      + 'generation creates pictures locally, at the cost of one extra download.</p>'));
    body.appendChild(AutoQuestionViews._grid(A.wantImage, [
      [true, 'Yes, add image generation', 'Chat and create images, all on this machine.'],
      [false, 'No, just chat', 'Smaller download. You can add images later.'],
    ], (want) => {
      A.wantImage = want;
      A.plan = null;
      A.view = w.musicOffered() ? 'question-music' : 'plan';
      w.render();
    }));
  }

  static music(w, body) {
    const A = w.state.auto;
    body.appendChild(Dom.el('div', 'wz-hero',
      '<h2>Do you also want music generation?</h2>'
      + '<p class="wz-dim">Compose full songs with vocals from lyrics, right on '
      + 'this machine. Needs serious GPU memory and about a 54 GB download, and songs '
      + 'take a few minutes each to render.</p>'));
    body.appendChild(AutoQuestionViews._grid(A.wantMusic, [
      [true, 'Yes, add music generation', 'Write lyrics in chat and get a finished song back.'],
      [false, 'No, skip music', 'You can add it later from the Music section.'],
    ], (want) => {
      A.wantMusic = want;
      A.plan = null;
      A.view = 'plan';
      w.render();
    }));
  }

  static _grid(current, choices, onPick) {
    const grid = Dom.el('div', 'wz-cards');
    for (const [want, title, desc] of choices) {
      grid.appendChild(ChoiceCard.button('luma-choice wz-card' + (current === want ? ' sel' : ''),
        ChoiceCard.titleDesc(title, desc), () => onPick(want)));
    }
    return grid;
  }
}
