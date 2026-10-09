import IndexedDbRepository from './IndexedDbRepository.js';
import ConversationStore from './ConversationStore.js';
import MessageStore from './MessageStore.js';
import ArtifactStore from './ArtifactStore.js';
import StoreRecords from './StoreRecords.js';

export default class LumaStore {
  static DB_NAME = 'luma-web-chat';
  static VERSION = 2;
  static SCHEMA = {
    [StoreRecords.CONVERSATIONS]: { keyPath: 'id', indexes: ['updatedAt'] },
    [StoreRecords.ARTIFACTS]: { keyPath: 'id', indexes: ['conversationId'] },
  };

  static open(indexedDB) {
    return new LumaStore(new IndexedDbRepository({
      indexedDB, name: LumaStore.DB_NAME, version: LumaStore.VERSION, stores: LumaStore.SCHEMA,
    }));
  }

  constructor(repo) {
    this.conversations = new ConversationStore(repo);
    this.messages = new MessageStore(repo);
    this.artifacts = new ArtifactStore(repo);
  }
}
