
import { openDB, DBSchema } from 'idb';
import { FileData } from '../types';

interface BackpackDB extends DBSchema {
  saved_files: {
    key: string;
    value: FileData;
  };
}

const DB_NAME = 'microspace-backpack';
const STORE_NAME = 'saved_files';

export const OfflineService = {
  dbPromise: openDB<BackpackDB>(DB_NAME, 1, {
    upgrade(db) {
      db.createObjectStore(STORE_NAME, { keyPath: 'id' });
    },
  }),

  async saveFile(file: FileData) {
    const db = await this.dbPromise;
    await db.put(STORE_NAME, { ...file, isSaved: true });
    
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
    await db.delete(STORE_NAME, fileId);
  },

  async getAllFiles() {
    const db = await this.dbPromise;
    return await db.getAll(STORE_NAME);
  },

  async isFileSaved(fileId: string) {
    const db = await this.dbPromise;
    const file = await db.get(STORE_NAME, fileId);
    return !!file;
  },

  async getAllSavedIds() {
      const db = await this.dbPromise;
      return await db.getAllKeys(STORE_NAME);
  }
};