const CuratedModelCatalog = require('../../core/llm-server/models/CuratedModelCatalog');
const ImageModelCatalog = require('../../core/image-server/models/ImageModelCatalog');
const MusicModelCatalog = require('../../core/music-server/models/MusicModelCatalog');

class CatalogUrlCollector {
  static collect({
    llm = { list: () => CuratedModelCatalog.listCatalog() },
    image = new ImageModelCatalog(),
    music = new MusicModelCatalog(),
  } = {}) {
    return [
      ...CatalogUrlCollector._llmRows(llm.list()),
      ...CatalogUrlCollector._imageRows(image.list()),
      ...CatalogUrlCollector._musicRows(music.list()),
    ];
  }

  static _llmRows(models) {
    const rows = [];
    for (const m of models) {
      for (const v of m.variants) rows.push({ catalog: 'llm', model: m.id, file: v.file, url: v.url });
    }
    return rows;
  }

  static _imageRows(models) {
    const rows = [];
    for (const m of models) {
      for (const f of Object.values(m.files || {})) {
        if (f && f.url) rows.push({ catalog: 'image', model: m.id, file: f.file, url: f.url });
        for (const q of (f && f.quants) || []) {
          if (q.url) rows.push({ catalog: 'image', model: `${m.id} (${q.id})`, file: q.file, url: q.url });
        }
      }
    }
    return rows;
  }

  static _musicRows(models) {
    return models.map((m) => ({
      catalog: 'music', model: m.id, file: 'config.json',
      url: `https://huggingface.co/${m.hfRepo}/resolve/main/config.json`,
    }));
  }
}

module.exports = CatalogUrlCollector;
