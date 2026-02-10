
import { openDB, DBSchema } from 'idb';
import { FileData, BackpackCollection } from '../types';

interface BackpackDB extends DBSchema {
  saved_files: {
    key: string;
    value: FileData;
  };
  collections: {
    key: string;
    value: BackpackCollection;
  }
}

const DB_NAME = 'microspace-backpack';
const FILES_STORE = 'saved_files';
const COLLECTIONS_STORE = 'collections';

export const OfflineService = {
  dbPromise: openDB<BackpackDB>(DB_NAME, 2, { 
    upgrade(db, oldVersion, newVersion, transaction) {
      if (!db.objectStoreNames.contains(FILES_STORE)) {
          db.createObjectStore(FILES_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(COLLECTIONS_STORE)) {
          db.createObjectStore(COLLECTIONS_STORE, { keyPath: 'id' });
      }
    },
  }),

  async saveFile(file: FileData) {
    const db = await this.dbPromise;
    await db.put(FILES_STORE, { ...file, isSaved: true });
    
    if (file.attachments && 'caches' in window) {
        try {
            const cache = await caches.open('microspace-dynamic-v1');
            const urlsToCache = file.attachments.map(a => a.url).filter(u => u && u.startsWith('http'));
            for (const url of urlsToCache) {
                try { await cache.add(url); } catch (e) { console.warn('Failed to cache image offline', url); }
            }
        } catch (e) {
            console.warn('Offline image caching failed', e);
        }
    }
  },

  async removeFile(fileId: string) {
    const db = await this.dbPromise;
    await db.delete(FILES_STORE, fileId);
  },

  async getAllFiles() {
    const db = await this.dbPromise;
    return await db.getAll(FILES_STORE);
  },

  async isFileSaved(fileId: string) {
    const db = await this.dbPromise;
    const file = await db.get(FILES_STORE, fileId);
    return !!file;
  },

  async getAllSavedIds() {
      const db = await this.dbPromise;
      return await db.getAllKeys(FILES_STORE);
  },

  async createCollection(name: string, color?: string) {
      const db = await this.dbPromise;
      const newCol: BackpackCollection = {
          id: Math.random().toString(36).substr(2, 9),
          name,
          color,
          created_at: new Date().toISOString()
      };
      await db.put(COLLECTIONS_STORE, newCol);
      return newCol;
  },

  async getCollections() {
      const db = await this.dbPromise;
      return await db.getAll(COLLECTIONS_STORE);
  },

  async deleteCollection(id: string) {
      const db = await this.dbPromise;
      await db.delete(COLLECTIONS_STORE, id);
      
      const allFiles = await db.getAll(FILES_STORE);
      const filesInCol = allFiles.filter(f => f.collection_id === id);
      
      for (const f of filesInCol) {
          f.collection_id = null; 
          await db.put(FILES_STORE, f);
      }
  },

  async addFileToCollection(fileId: string, collectionId: string) {
      const db = await this.dbPromise;
      const file = await db.get(FILES_STORE, fileId);
      if (file) {
          file.collection_id = collectionId;
          await db.put(FILES_STORE, file);
      }
  },

  async removeFileFromCollection(fileId: string) {
      const db = await this.dbPromise;
      const file = await db.get(FILES_STORE, fileId);
      if (file) {
          file.collection_id = undefined; 
          await db.put(FILES_STORE, file);
      }
  }
};
