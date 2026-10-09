const MediaModelCatalog = require('../../media-shared/MediaModelCatalog');
const ImageLoraEntries = require('./ImageLoraEntries');

class ImageLoraCatalog extends MediaModelCatalog {
  constructor() {
    super(ImageLoraEntries.ENTRIES);
  }

  entryFiles(entry) {
    if (!entry) return [];
    if (Array.isArray(entry.files)) return entry.files.filter((f) => f && f.file && f.url);
    if (!entry.file || !entry.url) return [];
    return [{ file: entry.file, url: entry.url, approxBytes: entry.approxBytes || 0 }];
  }
}

module.exports = ImageLoraCatalog;
