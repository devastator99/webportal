
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  message_type: string;
  created_at: string;
  synced: boolean;
}

interface OfflineDB extends DBSchema {
  offlineMessages: {
    key: string;
    value: ChatMessage;
    indexes: { 'by-synced': boolean };
  };
}

const DB_NAME = 'chat_offline_db';
const DB_VERSION = 1;
const MESSAGE_STORE = 'offlineMessages';

let dbPromise: Promise<IDBPDatabase<OfflineDB>>;

export const initOfflineDB = async () => {
  if (!dbPromise) {
    dbPromise = openDB<OfflineDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore(MESSAGE_STORE, { keyPath: 'id' });
        store.createIndex('by-synced', 'synced');
      },
    });
  }
  return dbPromise;
};

// Save an offline message
export const saveOfflineMessage = async (message: ChatMessage): Promise<void> => {
  const db = await initOfflineDB();
  await db.put(MESSAGE_STORE, { ...message, synced: false });
};

// Get all unsynced messages
export const getUnsyncedMessages = async (): Promise<ChatMessage[]> => {
  const db = await initOfflineDB();
  return db.getAllFromIndex(MESSAGE_STORE, 'by-synced', false);
};

// Mark message as synced
export const markMessageAsSynced = async (messageId: string): Promise<void> => {
  const db = await initOfflineDB();
  const message = await db.get(MESSAGE_STORE, messageId);
  if (message) {
    await db.put(MESSAGE_STORE, { ...message, synced: true });
  }
};

// Delete a message
export const deleteOfflineMessage = async (messageId: string): Promise<void> => {
  const db = await initOfflineDB();
  await db.delete(MESSAGE_STORE, messageId);
};

// Get all messages
export const getAllOfflineMessages = async (): Promise<ChatMessage[]> => {
  const db = await initOfflineDB();
  return db.getAll(MESSAGE_STORE);
};
