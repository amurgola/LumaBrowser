import OverlayInput from './OverlayInput.js';
import OverlayView from './OverlayView.js';

const root = document.getElementById('root');
new OverlayView(root, window.overlayAPI, window).attach();
new OverlayInput(root, window.overlayAPI, window).attach();
