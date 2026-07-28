/**
 * Studex IndexedDB Service Architecture (Preparation for Phase 2 offline sync & caching)
 */

const DB_NAME = 'studex_db';
const DB_VERSION = 1;

export interface OfflineStoreSchema {
  userProfile: 'profile';
  subjects: 'id';
  studyTargets: 'id';
  examCountdowns: 'id';
}

class StudexIndexedDB {
  private db: IDBDatabase | null = null;

  public async initDB(): Promise<IDBDatabase | null> {
    if (!('indexedDB' in window)) {
      console.warn('IndexedDB not supported in this browser context.');
      return null;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create stores if they do not exist
        if (!db.objectStoreNames.contains('userProfile')) {
          db.createObjectStore('userProfile', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('subjects')) {
          db.createObjectStore('subjects', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('studyTargets')) {
          db.createObjectStore('studyTargets', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('examCountdowns')) {
          db.createObjectStore('examCountdowns', { keyPath: 'id' });
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        console.log('Studex IndexedDB initialized successfully.');
        resolve(this.db);
      };

      request.onerror = (event) => {
        console.error('IndexedDB init error:', (event.target as IDBOpenDBRequest).error);
        reject((event.target as IDBOpenDBRequest).error);
      };
    });
  }

  public async getStoreItem<T>(storeName: string, key: string): Promise<T | null> {
    if (!this.db) await this.initDB();
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      try {
        const tx = this.db!.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.get(key);

        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      } catch (err) {
        console.warn(`IndexedDB read fallback for ${storeName}:`, err);
        resolve(null);
      }
    });
  }

  public async setStoreItem<T>(storeName: string, item: T): Promise<boolean> {
    if (!this.db) await this.initDB();
    if (!this.db) return false;

    return new Promise((resolve, reject) => {
      try {
        const tx = this.db!.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.put(item);

        req.onsuccess = () => resolve(true);
        req.onerror = () => reject(req.error);
      } catch (err) {
        console.warn(`IndexedDB write fallback for ${storeName}:`, err);
        resolve(false);
      }
    });
  }
}

export const studexDB = new StudexIndexedDB();
