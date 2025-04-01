
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { v4 as uuidv4 } from 'uuid';

interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  message_type: string;
  created_at: string;
  synced: boolean;
}

// Define the schema for our IndexedDB using the correct format
interface OfflineDB extends DBSchema {
  messages: {
    key: string;  // Primary key (id)
    value: ChatMessage;  // Value type
    indexes: {
      'by-synced': boolean;  // This should be the key path, not the type
    };
  };
}

const DB_NAME = 'chat_offline_db';
const DB_VERSION = 1;
const MESSAGE_STORE = 'messages';

let dbPromise: Promise<IDBPDatabase<OfflineDB>> | null = null;

export const initOfflineDB = async () => {
  if (!dbPromise) {
    dbPromise = openDB<OfflineDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(MESSAGE_STORE)) {
          const store = db.createObjectStore(MESSAGE_STORE, { keyPath: 'id' });
          store.createIndex('by-synced', 'synced');
        }
      },
    });
  }
  return dbPromise;
};

// Save an offline message
export const saveOfflineMessage = async (message: ChatMessage): Promise<void> => {
  const db = await initOfflineDB();
  try {
    await db.put(MESSAGE_STORE, { ...message, synced: false });
    console.log('Message saved successfully:', message.id);
  } catch (error) {
    console.error('Error saving offline message:', error);
    throw error;
  }
};

// Get all unsynced messages
export const getUnsyncedMessages = async (): Promise<ChatMessage[]> => {
  const db = await initOfflineDB();
  try {
    const messages = await db.getAllFromIndex(MESSAGE_STORE, 'by-synced', false);
    console.log('Retrieved unsynced messages:', messages.length);
    return messages;
  } catch (error) {
    console.error('Error getting unsynced messages:', error);
    return [];
  }
};

// Mark message as synced
export const markMessageAsSynced = async (messageId: string): Promise<void> => {
  const db = await initOfflineDB();
  try {
    const message = await db.get(MESSAGE_STORE, messageId);
    if (message) {
      await db.put(MESSAGE_STORE, { ...message, synced: true });
      console.log('Message marked as synced:', messageId);
    }
  } catch (error) {
    console.error('Error marking message as synced:', error);
    throw error;
  }
};

// Delete a message
export const deleteOfflineMessage = async (messageId: string): Promise<void> => {
  const db = await initOfflineDB();
  try {
    await db.delete(MESSAGE_STORE, messageId);
    console.log('Message deleted:', messageId);
  } catch (error) {
    console.error('Error deleting offline message:', error);
    throw error;
  }
};

// Get all messages
export const getAllOfflineMessages = async (): Promise<ChatMessage[]> => {
  const db = await initOfflineDB();
  try {
    const messages = await db.getAll(MESSAGE_STORE);
    console.log('Retrieved all messages:', messages.length);
    return messages;
  } catch (error) {
    console.error('Error getting all offline messages:', error);
    return [];
  }
};
