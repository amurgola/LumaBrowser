module.exports = {
  id: 'anima-model',
  name: 'Anima Image Model',
  version: '1.0.0',
  description:
    'Adds the Anima anime text-to-image model (CircleStone Labs × Comfy Org, '
    + 'built on NVIDIA Cosmos-Predict2) to the image-model catalog for one-click '
    + 'download. Demonstrates the image-catalog extension surface '
    + '(context.imageCatalog). Disabling it just removes the catalog entry; any '
    + 'already-installed Anima keeps working from its own manifest.',

  private: true,
  distributable: true,

  dependencies: {},

  main: './main.js',
};
