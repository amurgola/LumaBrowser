export default class DropTargets {
  static DRAG_TYPE = 'text/plain';

  static wire(target, descriptor, onDrop) {
    target.addEventListener('dragover', (e) => { e.preventDefault(); target.classList.add('drop'); });
    target.addEventListener('dragleave', () => target.classList.remove('drop'));
    target.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      target.classList.remove('drop');
      const itemKey = e.dataTransfer.getData(DropTargets.DRAG_TYPE);
      if (itemKey) onDrop(itemKey, descriptor);
    });
  }

  static makeDraggable(chip, itemKey) {
    chip.draggable = true;
    chip.dataset.slot = itemKey;
    chip.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData(DropTargets.DRAG_TYPE, itemKey);
      e.dataTransfer.effectAllowed = 'move';
    });
  }
}
