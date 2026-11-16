const fs = require('fs');
const path = require('path');

class TrainingDataset {
  static CANCELED = 'CANCELED';
  static INDEX_WIDTH = 4;

  constructor({ captioner, fsOps = fs }) {
    this._captioner = captioner;
    this._fs = fsOps;
  }

  async build({ dir, images, recipe, trigger, subject, onProgress = () => {}, isCanceled = () => false }) {
    this._startClean(dir);
    let described = 0;
    for (let index = 0; index < images.length; index += 1) {
      if (isCanceled()) throw TrainingDataset._canceled();
      const written = await this._writePair(dir, index, images[index], { style: recipe.captionStyle, trigger, subject });
      if (written.described) described += 1;
      onProgress(index + 1, images.length);
    }
    return { dir, count: images.length, described };
  }

  _startClean(dir) {
    this._fs.rmSync(dir, { recursive: true, force: true });
    this._fs.mkdirSync(dir, { recursive: true });
  }

  async _writePair(dir, index, image, { style, trigger, subject }) {
    const stem = String(index + 1).padStart(TrainingDataset.INDEX_WIDTH, '0');
    this._fs.writeFileSync(path.join(dir, `${stem}.${image.ext}`), image.bytes);
    const { caption, described } = await this._captioner.caption({ bytes: image.bytes, ext: image.ext, style, trigger, subject });
    this._fs.writeFileSync(path.join(dir, `${stem}.txt`), caption);
    return { described };
  }

  static _canceled() {
    const err = new Error('Training was canceled while the dataset was being prepared.');
    err.code = TrainingDataset.CANCELED;
    return err;
  }
}

module.exports = TrainingDataset;
