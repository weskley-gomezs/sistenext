import { db } from '../firebase';
import { doc, setDoc, deleteDoc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { offlineDatabase } from './OfflineDatabase';
import { networkService } from './NetworkService';

export type SyncStatus = 'synced' | 'syncing' | 'error';

class SyncService {
  private status: SyncStatus = 'synced';
  private statusListeners: Set<(status: SyncStatus) => void> = new Set();
  private isSyncing = false;

  constructor() {
    // Listen to network changes to trigger auto-sync
    networkService.subscribe((isOnline) => {
      if (isOnline) {
        this.sync().catch(err => console.error('Auto-sync failed:', err));
      }
    });
  }

  getStatus(): SyncStatus {
    return this.status;
  }

  subscribeStatus(callback: (status: SyncStatus) => void): () => void {
    this.statusListeners.add(callback);
    callback(this.status);
    return () => {
      this.statusListeners.delete(callback);
    };
  }

  private setStatus(newStatus: SyncStatus) {
    this.status = newStatus;
    this.statusListeners.forEach((cb) => cb(newStatus));
  }

  // Process the local sync queue to Firestore
  async processQueue(): Promise<void> {
    if (!networkService.isOnline()) return;

    const queue = await offlineDatabase.getQueue();
    if (queue.length === 0) {
      return;
    }

    this.setStatus('syncing');

    for (const item of queue) {
      const { id, colName, recordId, operation, data, ownerId } = item;
      try {
        const docRef = doc(db, colName, recordId);

        if (operation === 'CREATE') {
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            const serverData = snap.data();
            const serverUpdatedAt = serverData.updatedAt || serverData.createdAt || '';
            const localUpdatedAt = data.updatedAt || data.createdAt || '';
            
            if (serverUpdatedAt && localUpdatedAt && serverUpdatedAt > localUpdatedAt) {
              console.warn(`Conflict on CREATE: Server version of ${colName}/${recordId} is newer. Keeping server version.`);
              await offlineDatabase.put(colName, { ...serverData, id: recordId });
              await this.logConflict(ownerId, colName, recordId, 'CREATE_CONFLICT', data, serverData);
            } else {
              await setDoc(docRef, data);
            }
          } else {
            await setDoc(docRef, data);
          }
        } else if (operation === 'UPDATE') {
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            const serverData = snap.data();
            const serverUpdatedAt = serverData.updatedAt || '';
            const localUpdatedAt = data.updatedAt || '';

            if (serverUpdatedAt && localUpdatedAt && serverUpdatedAt > localUpdatedAt) {
              console.warn(`Conflict on UPDATE: Server version of ${colName}/${recordId} is newer.`);
              await offlineDatabase.put(colName, { ...serverData, id: recordId });
              await this.logConflict(ownerId, colName, recordId, 'UPDATE_CONFLICT', data, serverData);
            } else {
              await setDoc(docRef, { ...serverData, ...data });
            }
          } else {
            await setDoc(docRef, data);
          }
        } else if (operation === 'DELETE') {
          await deleteDoc(docRef);
        }

        // Successfully synchronized, remove from local queue
        await offlineDatabase.removeFromQueue(id);
      } catch (err) {
        console.error(`Sync failed for item ${id}:`, err);
        this.setStatus('error');
        throw err;
      }
    }
  }

  // Log conflict in local logs list & sync it to server
  private async logConflict(
    ownerId: string,
    collectionName: string,
    recordId: string,
    type: string,
    localData: any,
    serverData: any
  ) {
    const conflictLog = {
      id: `conflict_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      ownerId,
      operation: 'CONFLICT_LOG',
      collection: collectionName,
      recordId,
      justification: `Conflito resolvido: mantido versão mais recente para o registro ${recordId} na coleção ${collectionName}`,
      timestamp: new Date().toISOString(),
      user: 'Sistema Offline Sync',
      data: {
        conflictType: type,
        localData,
        serverData
      }
    };
    await offlineDatabase.put('logs', conflictLog);
    const docRef = doc(db, 'logs', conflictLog.id);
    await setDoc(docRef, conflictLog).catch(e => console.error('Failed to sync conflict log directly:', e));
  }

  // Pull updates from Firestore for all collections of the owner
  async pullUpdates(ownerId: string, collectionsList: string[]): Promise<void> {
    if (!networkService.isOnline()) return;

    for (const colName of collectionsList) {
      if (colName === 'sync_queue') continue;
      try {
        let snapshot;
        if (colName === 'configuracoes') {
          // Special query for config, it is key-by-ownerId
          const docRef = doc(db, 'configuracoes', ownerId);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            await offlineDatabase.put('configuracoes', { ...snap.data(), id: ownerId });
          }
          continue;
        }

        const colRef = collection(db, colName);
        const q = query(colRef, where('ownerId', '==', ownerId));
        snapshot = await getDocs(q);

        const serverRecords: any[] = [];
        snapshot.forEach((docSnap) => {
          serverRecords.push({ ...docSnap.data(), id: docSnap.id });
        });

        // Get local records to find items to delete locally or resolve conflicts
        const localRecords = await offlineDatabase.getAll<any>(colName, ownerId);
        const serverRecordIds = new Set(serverRecords.map(r => r.id));

        // Find items that are deleted on server but exist locally (excluding pending queue items)
        const queue = await offlineDatabase.getQueue();
        const pendingQueueRecordIds = new Set(queue.filter(qItem => qItem.colName === colName).map(qItem => qItem.recordId));

        for (const localRec of localRecords) {
          if (!serverRecordIds.has(localRec.id) && !pendingQueueRecordIds.has(localRec.id)) {
            await offlineDatabase.delete(colName, localRec.id);
          }
        }

        // Save server records locally unless there is a pending local change
        for (const serverRec of serverRecords) {
          if (!pendingQueueRecordIds.has(serverRec.id)) {
            await offlineDatabase.put(colName, serverRec);
          }
        }
      } catch (err) {
        console.error(`Failed to pull updates for ${colName}:`, err);
      }
    }
  }

  // Perform full bi-directional sync (push and then pull)
  async sync(ownerId?: string, collectionsList?: string[]): Promise<void> {
    if (ownerId === 'demo-user-id') return;
    if (this.isSyncing) return;
    this.isSyncing = true;
    this.setStatus('syncing');

    try {
      // First push local changes
      await this.processQueue();

      // Then pull remote updates if ownerId and collection list are provided
      if (ownerId && collectionsList) {
        await this.pullUpdates(ownerId, collectionsList);
      }

      this.setStatus('synced');
    } catch (err) {
      console.error('Sync failed:', err);
      this.setStatus('error');
    } finally {
      this.isSyncing = false;
    }
  }
}

export const syncService = new SyncService();
