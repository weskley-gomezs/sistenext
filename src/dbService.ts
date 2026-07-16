import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  where,
  limit,
  writeBatch
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { offlineDatabase } from './services/OfflineDatabase';
import { syncService } from './services/SyncService';

let activeUserEmail: string | null = null;

export function setActiveUserEmail(email: string | null) {
  activeUserEmail = email;
}

export function getActiveUserEmail(): string {
  return auth.currentUser?.email || activeUserEmail || 'Sistema';
}
import {
  Lead,
  Empresa,
  Cliente,
  Projeto,
  Proposta,
  Contrato,
  Financeiro,
  EventAgenda,
  Anotacao,
  Documento,
  FollowUp,
  LeadStatus,
  LeadTemperature
} from './types';

// Generic Error Handler
enum OperationType {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LIST = 'LIST',
  WRITE = 'WRITE' // General write fallback
}

function handleFirestoreError(error: any, operation: OperationType, details?: string): never {
  const errInfo = {
    message: error?.message || 'Unknown Firestore Error',
    code: error?.code || 'unknown',
    operation,
    details,
    timestamp: new Date().toISOString()
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

function sanitizeData(data: any): any {
  if (data === null || typeof data !== 'object') return data;
  const sanitized = Array.isArray(data) ? [...data] : { ...data };
  
  Object.keys(sanitized).forEach(key => {
    if (sanitized[key] === undefined) {
      delete sanitized[key];
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeData(sanitized[key]);
    }
  });
  
  return sanitized;
}

// ------------------- LOCAL SUBSCRIBERS REGISTRY -------------------

interface Subscription {
  colName: string;
  ownerId: string;
  callback: (data: any[]) => void;
}

const activeSubscriptions: Set<Subscription> = new Set();

export async function notifySubscribers(colName: string, ownerId: string) {
  try {
    const localItems = await offlineDatabase.getAll<any>(colName, ownerId);
    activeSubscriptions.forEach((sub) => {
      if (sub.colName === colName && sub.ownerId === ownerId) {
        sub.callback(localItems);
      }
    });
  } catch (err) {
    console.error(`Failed to notify subscribers for ${colName}:`, err);
  }
}

// ------------------- CRUD API INTERFACES -------------------

// Generic Subscribe to Collection - Offline-First with Real-Time Synced Fallback
export function subscribeToCollection<T>(colName: string, ownerId: string, callback: (data: T[]) => void) {
  const sub: Subscription = { colName, ownerId, callback: callback as any };
  activeSubscriptions.add(sub);

  // 1. Instantly load from local IndexedDB
  offlineDatabase.getAll<T>(colName, ownerId)
    .then((localItems) => {
      callback(localItems);
    })
    .catch((err) => console.error(`Failed to load local database for ${colName}:`, err));

  // 2. Subscribe to Firestore updates in background
  let firestoreUnsub: (() => void) | null = null;
  try {
    const colRef = collection(db, colName);
    const q = query(colRef, where('ownerId', '==', ownerId));
    
    firestoreUnsub = onSnapshot(q, (snapshot) => {
      const serverRecords: any[] = [];
      snapshot.forEach((docSnap) => {
        serverRecords.push({ ...docSnap.data(), id: docSnap.id });
      });

      // Write updates to IndexedDB *only* if they are not pending sync locally
      offlineDatabase.getQueue().then((queue) => {
        const pendingQueueRecordIds = new Set(
          queue.filter(qItem => qItem.colName === colName).map(qItem => qItem.recordId)
        );

        const writePromises = serverRecords.map(async (serverRec) => {
          if (!pendingQueueRecordIds.has(serverRec.id)) {
            await offlineDatabase.put(colName, serverRec);
          }
        });

        Promise.all(writePromises).then(() => {
          notifySubscribers(colName, ownerId);
        });
      });
    }, (error) => {
      console.warn(`Firestore onSnapshot failed/offline for ${colName}:`, error);
    });
  } catch (err) {
    console.warn(`Firestore subscription failed (offline):`, err);
  }

  return () => {
    activeSubscriptions.delete(sub);
    if (firestoreUnsub) {
      firestoreUnsub();
    }
  };
}

// Generic Add Item
export async function addItem<T>(colName: string, item: Omit<T, 'id'>, ownerId: string): Promise<string> {
  const userEmail = getActiveUserEmail();
  const now = new Date().toISOString();
  
  // Pre-generate ID to avoid depending on Firestore online connection
  const id = (item as any).id || doc(collection(db, colName)).id;
  
  const payload = {
    ...item,
    id,
    ownerId,
    createdBy: (item as any).createdBy || userEmail,
    createdAt: (item as any).createdAt || now
  };
  const sanitizedItem = sanitizeData(payload);

  try {
    // 1. Save locally to IndexedDB first
    await offlineDatabase.put(colName, sanitizedItem);

    // Create and save log entry locally
    if (colName !== 'logs') {
      const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
      const logPayload = sanitizeData({
        id: logId,
        ownerId,
        operation: 'CREATE',
        collection: colName,
        recordId: id,
        justification: 'Criação de registro',
        timestamp: now,
        user: userEmail,
        data: sanitizedItem
      });
      await offlineDatabase.put('logs', logPayload);
      await offlineDatabase.addToQueue('logs', logId, 'CREATE', logPayload, ownerId);
    }

    // 2. Add main operation to sync queue
    await offlineDatabase.addToQueue(colName, id, 'CREATE', sanitizedItem, ownerId);

    // 3. Notify local subscribers instantly
    notifySubscribers(colName, ownerId);
    if (colName !== 'logs') {
      notifySubscribers('logs', ownerId);
    }

    // 4. Trigger sync in background asynchronously
    syncService.sync(ownerId, [colName, 'logs']).catch((err) => console.error('Background sync failed:', err));

    return id;
  } catch (error) {
    console.error('Error adding item offline-first:', error);
    handleFirestoreError(error, OperationType.CREATE, `${colName}/${id}`);
  }
}

// Generic Update Item
export async function updateItem<T>(colName: string, id: string, item: Partial<T>, ownerId: string): Promise<void> {
  const userEmail = getActiveUserEmail();
  const now = new Date().toISOString();
  const sanitizedItem = sanitizeData(item);

  try {
    // 1. Fetch current local record to merge updates properly
    const existingRecord = await offlineDatabase.getById<any>(colName, id);
    const updatedRecord = {
      ...(existingRecord || {}),
      ...sanitizedItem,
      id,
      ownerId,
      updatedAt: now
    };

    // 2. Put back to local database
    await offlineDatabase.put(colName, updatedRecord);

    // Create and save log entry locally
    if (colName !== 'logs') {
      const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
      const logPayload = sanitizeData({
        id: logId,
        ownerId,
        operation: 'UPDATE',
        collection: colName,
        recordId: id,
        justification: 'Atualização de registro',
        timestamp: now,
        user: userEmail,
        data: sanitizedItem
      });
      await offlineDatabase.put('logs', logPayload);
      await offlineDatabase.addToQueue('logs', logId, 'CREATE', logPayload, ownerId);
    }

    // 3. Add to sync queue
    await offlineDatabase.addToQueue(colName, id, 'UPDATE', updatedRecord, ownerId);

    // 4. Notify local subscribers instantly
    notifySubscribers(colName, ownerId);
    if (colName !== 'logs') {
      notifySubscribers('logs', ownerId);
    }

    // 5. Trigger sync in background
    syncService.sync(ownerId, [colName, 'logs']).catch((err) => console.error('Background sync failed:', err));
  } catch (error) {
    console.error('Error updating item offline-first:', error);
    handleFirestoreError(error, OperationType.UPDATE, `${colName}/${id}`);
  }
}

// Generic Delete Item
export async function deleteItem(colName: string, id: string, ownerId: string): Promise<void> {
  const userEmail = getActiveUserEmail();
  const now = new Date().toISOString();

  try {
    // 1. Delete from local database
    await offlineDatabase.delete(colName, id);

    // Create and save log entry locally
    if (colName !== 'logs') {
      const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
      const logPayload = sanitizeData({
        id: logId,
        ownerId,
        operation: 'DELETE',
        collection: colName,
        recordId: id,
        justification: 'Exclusão direta',
        timestamp: now,
        user: userEmail,
        data: { id }
      });
      await offlineDatabase.put('logs', logPayload);
      await offlineDatabase.addToQueue('logs', logId, 'CREATE', logPayload, ownerId);
    }

    // 2. Add deletion to sync queue
    await offlineDatabase.addToQueue(colName, id, 'DELETE', null, ownerId);

    // 3. Notify local subscribers instantly
    notifySubscribers(colName, ownerId);
    if (colName !== 'logs') {
      notifySubscribers('logs', ownerId);
    }

    // 4. Trigger sync in background
    syncService.sync(ownerId, [colName, 'logs']).catch((err) => console.error('Background sync failed:', err));
  } catch (error) {
    console.error('Error deleting item offline-first:', error);
    handleFirestoreError(error, OperationType.DELETE, `${colName}/${id}`);
  }
}

// Delete with Justification (Logs the deletion in 'logs' collection)
export async function deleteItemWithJustification(colName: string, id: string, itemData: any, justification: string, ownerId: string): Promise<void> {
  const userEmail = getActiveUserEmail();
  const now = new Date().toISOString();

  try {
    // 1. Delete from local database
    await offlineDatabase.delete(colName, id);

    // Create and save log entry locally with justification
    const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
    const logPayload = sanitizeData({
      id: logId,
      ownerId,
      operation: 'DELETE',
      collection: colName,
      recordId: id,
      justification,
      timestamp: now,
      user: userEmail,
      data: itemData
    });
    await offlineDatabase.put('logs', logPayload);
    await offlineDatabase.addToQueue('logs', logId, 'CREATE', logPayload, ownerId);

    // 2. Add deletion to sync queue
    await offlineDatabase.addToQueue(colName, id, 'DELETE', null, ownerId);

    // 3. Notify local subscribers instantly
    notifySubscribers(colName, ownerId);
    notifySubscribers('logs', ownerId);

    // 4. Trigger sync in background
    syncService.sync(ownerId, [colName, 'logs']).catch((err) => console.error('Background sync failed:', err));
  } catch (error) {
    console.error('Error deleting item with justification offline-first:', error);
    handleFirestoreError(error, OperationType.DELETE, `${colName}/${id}`);
  }
}

/**
 * Isolated Application Config
 * Each ownerId has their own 'global' doc in 'configuracoes'
 */
export async function setAppConfig(ownerId: string, data: any): Promise<void> {
  const userEmail = getActiveUserEmail();
  const now = new Date().toISOString();
  const sanitizedData = sanitizeData({
    ...data,
    id: ownerId,
    ownerId,
    updatedAt: now
  });

  try {
    // 1. Save locally to IndexedDB
    await offlineDatabase.put('configuracoes', sanitizedData);

    // Create and save log entry locally
    const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
    const logPayload = sanitizeData({
      id: logId,
      ownerId,
      operation: 'UPDATE',
      collection: 'configuracoes',
      recordId: ownerId,
      justification: 'Atualizou as configurações da empresa',
      timestamp: now,
      user: userEmail,
      data: { name: sanitizedData.companyName || sanitizedData.tradingName || 'Configurações' }
    });
    await offlineDatabase.put('logs', logPayload);
    await offlineDatabase.addToQueue('logs', logId, 'CREATE', logPayload, ownerId);

    // 2. Add to sync queue
    await offlineDatabase.addToQueue('configuracoes', ownerId, 'UPDATE', sanitizedData, ownerId);

    // 3. Notify local subscribers instantly
    notifySubscribers('configuracoes', ownerId);
    notifySubscribers('logs', ownerId);

    // 4. Trigger sync in background
    syncService.sync(ownerId, ['configuracoes', 'logs']).catch((err) => console.error('Background sync failed:', err));
  } catch (error) {
    console.error('Error setting app config offline-first:', error);
    handleFirestoreError(error, OperationType.UPDATE, `configuracoes/${ownerId}`);
  }
}

export async function getAppConfig(ownerId: string): Promise<any> {
  try {
    // Try local IndexedDB first
    const localConfig = await offlineDatabase.getById<any>('configuracoes', ownerId);
    if (localConfig) return localConfig;

    // Otherwise, fallback to remote Firestore
    const docRef = doc(db, 'configuracoes', ownerId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const serverConfig = snap.data();
      await offlineDatabase.put('configuracoes', { ...serverConfig, id: ownerId });
      return serverConfig;
    }
  } catch (error) {
    console.warn('Failed to fetch remote config, returning null:', error);
  }
  return null;
}


