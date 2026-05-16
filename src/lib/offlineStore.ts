// Offline data persistence using IndexedDB
// Stores market rates, sync times, and user state for offline access

const DB_NAME = 'pledgevault-offline';
const DB_VERSION = 1;
const STORES = {
  MARKET_RATES: 'market_rates',
  SYNC_STATUS: 'sync_status',
  USER_CACHE: 'user_cache'
};

let db: IDBDatabase | null = null;

const initDB = async (): Promise<IDBDatabase> => {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      // Market rates store
      if (!database.objectStoreNames.contains(STORES.MARKET_RATES)) {
        const marketStore = database.createObjectStore(STORES.MARKET_RATES, { keyPath: 'id', autoIncrement: true });
        marketStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // Sync status store
      if (!database.objectStoreNames.contains(STORES.SYNC_STATUS)) {
        database.createObjectStore(STORES.SYNC_STATUS, { keyPath: 'key' });
      }

      // User cache store
      if (!database.objectStoreNames.contains(STORES.USER_CACHE)) {
        database.createObjectStore(STORES.USER_CACHE, { keyPath: 'key' });
      }
    };
  });
};

export const offlineStore = {
  // Market Rates
  async saveMarketRates(rates: {
    gold24k: number;
    gold22k: number;
    silver: number;
  }) {
    try {
      const database = await initDB();
      const tx = database.transaction([STORES.MARKET_RATES, STORES.SYNC_STATUS], 'readwrite');
      
      // Save rates
      const ratesStore = tx.objectStore(STORES.MARKET_RATES);
      await new Promise((resolve, reject) => {
        const req = ratesStore.add({
          ...rates,
          timestamp: Date.now()
        });
        req.onsuccess = () => resolve(null);
        req.onerror = () => reject(req.error);
      });

      // Update sync time
      const syncStore = tx.objectStore(STORES.SYNC_STATUS);
      await new Promise((resolve, reject) => {
        const req = syncStore.put({
          key: 'last_market_sync',
          value: Date.now()
        });
        req.onsuccess = () => resolve(null);
        req.onerror = () => reject(req.error);
      });

      return true;
    } catch (err) {
      console.warn('Failed to save market rates to offline store:', err);
      return false;
    }
  },

  async getLatestMarketRates() {
    try {
      const database = await initDB();
      const store = database.transaction(STORES.MARKET_RATES, 'readonly').objectStore(STORES.MARKET_RATES);
      const index = store.index('timestamp');

      return new Promise((resolve) => {
        const req = index.openCursor(null, 'prev'); // Latest first
        req.onsuccess = () => {
          const cursor = req.result;
          resolve(cursor ? cursor.value : null);
        };
        req.onerror = () => resolve(null);
      });
    } catch (err) {
      console.warn('Failed to get market rates from offline store:', err);
      return null;
    }
  },

  async getLastSyncTime(): Promise<number | null> {
    try {
      const database = await initDB();
      const store = database.transaction(STORES.SYNC_STATUS, 'readonly').objectStore(STORES.SYNC_STATUS);

      return new Promise((resolve) => {
        const req = store.get('last_market_sync');
        req.onsuccess = () => resolve(req.result?.value || null);
        req.onerror = () => resolve(null);
      });
    } catch (err) {
      console.warn('Failed to get sync time:', err);
      return null;
    }
  },

  async clearOldRates(hoursOld = 168) {
    try {
      const database = await initDB();
      const store = database.transaction(STORES.MARKET_RATES, 'readwrite').objectStore(STORES.MARKET_RATES);
      const cutoffTime = Date.now() - hoursOld * 60 * 60 * 1000;

      return new Promise((resolve) => {
        const index = store.index('timestamp');
        const range = IDBKeyRange.upperBound(cutoffTime);
        const req = index.openCursor(range);

        req.onsuccess = () => {
          const cursor = req.result;
          if (cursor) {
            cursor.delete();
            cursor.continue();
          } else {
            resolve(null);
          }
        };
        req.onerror = () => resolve(null);
      });
    } catch (err) {
      console.warn('Failed to clear old rates:', err);
    }
  },

  // User cache (for user profile on offline)
  async cacheUserProfile(userId: string, profile: any) {
    try {
      const database = await initDB();
      const store = database.transaction(STORES.USER_CACHE, 'readwrite').objectStore(STORES.USER_CACHE);

      return new Promise((resolve, reject) => {
        const req = store.put({
          key: `user_${userId}`,
          value: profile,
          timestamp: Date.now()
        });
        req.onsuccess = () => resolve(null);
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('Failed to cache user profile:', err);
    }
  },

  async getUserProfile(userId: string) {
    try {
      const database = await initDB();
      const store = database.transaction(STORES.USER_CACHE, 'readonly').objectStore(STORES.USER_CACHE);

      return new Promise((resolve) => {
        const req = store.get(`user_${userId}`);
        req.onsuccess = () => resolve(req.result?.value || null);
        req.onerror = () => resolve(null);
      });
    } catch (err) {
      console.warn('Failed to get user profile:', err);
      return null;
    }
  }
};
