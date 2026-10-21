const HfPinnedRepo = require('../../llm-server/models/HfPinnedRepo');

class HfRepoSiblings {
  static async fetch(repoId) {
    return (await HfRepoSiblings.fetchListing(repoId)).names;
  }

  static async fetchListing(repoId) {
    const pinned = await HfPinnedRepo.pin(repoId);
    return {
      revision: pinned.describe(),
      files: pinned.files.map((file) => ({ path: file.path, size: file.size, sha256: file.sha256 })),
      names: pinned.files.map((file) => file.path),
    };
  }
}

module.exports = HfRepoSiblings;
