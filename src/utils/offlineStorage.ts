
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { v4 as uuidv4 } from 'uuid';

interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  message_type: string;
  created_at: string;
  synced: boolean | string; // Allow both boolean and string for flexibility
}

// Define the schema for our IndexedDB
interface OfflineDB extends DBSchema {
  messages: {
    key: string;
    value: ChatMessage;
    indexes: {
      'by-synced': string;  // Index must use string type for IDB compatibility
    };
  };
}

const DB_NAME = 'chat_offline_db';
const DB_VERSION = 1;
const MESSAGE_STORE = 'messages';

let dbPromise: Promise<IDBPDatabase<OfflineDB>> | null = null;

export const initOfflineDB = async () => {
  if (!dbPromise) {
    try {
      dbPromise = openDB<OfflineDB>(DB_NAME, DB_VERSION, {
        upgrade(db) {
          if (!db.objectStoreNames.contains(MESSAGE_STORE)) {
            const store = db.createObjectStore(MESSAGE_STORE, { keyPath: 'id' });
            // Create an index on synced field, but store it as string 'true'/'false'
            store.createIndex('by-synced', 'synced', { unique: false });
          }
        },
      });
      console.info('IndexedDB initialized successfully');
      console.info('Offline chat database initialized');
    } catch (error) {
      console.error('Failed to initialize IndexedDB:', error);
      throw error;
    }
  }
  return dbPromise;
};

// Helper function to convert boolean to string for IndexedDB
const boolToString = (value: boolean | string | undefined): string => {
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  return value === 'true' ? 'true' : 'false';
};

// Save an offline message
export const saveOfflineMessage = async (message: ChatMessage): Promise<void> => {
  const db = await initOfflineDB();
  try {
    // Ensure synced is stored as a string for indexing
    const messageToStore = {
      ...message,
      synced: boolToString(message.synced || false),
    };
    await db.put(MESSAGE_STORE, messageToStore);
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
    // Use string 'false' for querying the index
    const messages = await db.getAllFromIndex(MESSAGE_STORE, 'by-synced', 'false');
    console.log('Retrieved unsynced messages:', messages.length);
    return messages.map(msg => ({
      ...msg,
      synced: msg.synced === 'true' // Convert string back to boolean
    }));
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
      // Update with string 'true' for indexing
      await db.put(MESSAGE_STORE, { ...message, synced: 'true' });
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
    return messages.map(msg => ({
      ...msg,
      synced: msg.synced === 'true' // Ensure consistent return type
    }));
  } catch (error) {
    console.error('Error getting all offline messages:', error);
    return [];
  }
};
