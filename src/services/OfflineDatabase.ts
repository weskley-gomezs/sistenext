const DB_NAME = 'SisteNextOfflineDB';
const DB_VERSION = 2;

export const OFFLINE_STORES = [
  'leads',
  'empresas',
  'clientes',
  'projetos',
  'propostas',
  'contratos',
  'financeiro',
  'agenda',
  'follow_ups',
  'anotacoes',
  'documentos',
  'equipe',
  'logs',
  'oportunidades',
  'configuracoes',
  'user_profiles',
  'sync_queue',
  'planejamentos',
  'nichos',
  'estrategias',
  'conteudos',
  'prospeccoes',
  'diagnosticos',
  'projetosPromocionais',
  'cases',
  'ideias',
  'relatorios',
  'metas'
];

class OfflineDatabase {
  private db: IDBDatabase | null = null;

  private initDB(): Promise<IDBDatabase> {
    if (this.db) return Promise.resolve(this.db);

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open Offline database');
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(request.result);
      };

      request.onupgradeneeded = () => {
        const db = request.result;
        OFFLINE_STORES.forEach((storeName) => {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, { keyPath: 'id' });
          }
        });
      };
    });
  }

  async getAll<T>(storeName: string, ownerId?: string): Promise<T[]> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        let results = request.result as T[];
        if (ownerId && storeName !== 'sync_queue' && storeName !== 'user_profiles' && storeName !== 'configuracoes') {
          results = results.filter((item: any) => item.ownerId === ownerId);
        }
        resolve(results);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async getById<T>(storeName: string, id: string): Promise<T | null> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async put<T>(storeName: string, item: T): Promise<void> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(item);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async delete(storeName: string, id: string): Promise<void> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async clear(storeName: string): Promise<void> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  // Sync Queue Helpers
  async addToQueue(
    colName: string,
    recordId: string,
    operation: 'CREATE' | 'UPDATE' | 'DELETE',
    data: any,
    ownerId: string
  ): Promise<void> {
    const queueId = `${colName}_${recordId}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const queueItem = {
      id: queueId,
      colName,
      recordId,
      operation,
      data,
      timestamp: new Date().toISOString(),
      ownerId
    };
    await this.put('sync_queue', queueItem);
  }

  async getQueue(): Promise<any[]> {
    const items = await this.getAll<any>('sync_queue');
    return items.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }

  async removeFromQueue(id: string): Promise<void> {
    await this.delete('sync_queue', id);
  }
}

export const offlineDatabase = new OfflineDatabase();
