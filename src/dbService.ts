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

// ------------------- CRUD API INTERFACES -------------------

// Generic Subscribe to Collection
export function subscribeToCollection<T>(colName: string, ownerId: string, callback: (data: T[]) => void) {
  const colRef = collection(db, colName);
  const q = query(colRef, where('ownerId', '==', ownerId));
  
  return onSnapshot(q, (snapshot) => {
    const list: T[] = [];
    snapshot.forEach((doc) => {
      list.push({ ...doc.data(), id: doc.id } as unknown as T);
    });
    callback(list);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, colName);
  });
}

// Generic Add Item
export async function addItem<T>(colName: string, item: Omit<T, 'id'>, ownerId: string): Promise<string> {
  const colRef = collection(db, colName);
  const docRef = doc(colRef);
  try {
    const userEmail = getActiveUserEmail();
    const now = new Date().toISOString();
    const payload = {
      ...item,
      id: docRef.id,
      ownerId,
      createdBy: (item as any).createdBy || userEmail,
      createdAt: (item as any).createdAt || now
    };
    const sanitizedItem = sanitizeData(payload);
    await setDoc(docRef, sanitizedItem);

    // Log creation
    if (colName !== 'logs') {
      const logRef = doc(collection(db, 'logs'));
      await setDoc(logRef, sanitizeData({
        id: logRef.id,
        ownerId,
        operation: 'CREATE',
        collection: colName,
        recordId: docRef.id,
        justification: 'Criação de registro',
        timestamp: now,
        user: userEmail,
        data: sanitizedItem
      }));
    }

    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${colName}/${docRef.id}`);
  }
}

// Generic Update Item
export async function updateItem<T>(colName: string, id: string, item: Partial<T>, ownerId: string): Promise<void> {
  const docRef = doc(db, colName, id);
  try {
    const userEmail = getActiveUserEmail();
    const now = new Date().toISOString();
    const sanitizedItem = sanitizeData(item);
    await updateDoc(docRef, sanitizedItem);

    // Log update
    if (colName !== 'logs') {
      const logRef = doc(collection(db, 'logs'));
      await setDoc(logRef, sanitizeData({
        id: logRef.id,
        ownerId,
        operation: 'UPDATE',
        collection: colName,
        recordId: id,
        justification: 'Atualização de registro',
        timestamp: now,
        user: userEmail,
        data: sanitizedItem
      }));
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${colName}/${id}`);
  }
}

// Generic Delete Item
export async function deleteItem(colName: string, id: string, ownerId: string): Promise<void> {
  const docRef = doc(db, colName, id);
  try {
    const userEmail = getActiveUserEmail();
    const now = new Date().toISOString();
    await deleteDoc(docRef);

    // Log deletion
    if (colName !== 'logs') {
      const logRef = doc(collection(db, 'logs'));
      await setDoc(logRef, sanitizeData({
        id: logRef.id,
        ownerId,
        operation: 'DELETE',
        collection: colName,
        recordId: id,
        justification: 'Exclusão direta',
        timestamp: now,
        user: userEmail,
        data: { id }
      }));
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${colName}/${id}`);
  }
}

// Delete with Justification (Logs the deletion in 'logs' collection)
export async function deleteItemWithJustification(colName: string, id: string, itemData: any, justification: string, ownerId: string): Promise<void> {
  const docRef = doc(db, colName, id);
  const logRef = doc(collection(db, 'logs'));
  
  try {
    const batch = writeBatch(db);
    
    // Create audit log
    batch.set(logRef, sanitizeData({
      id: logRef.id,
      ownerId,
      operation: 'DELETE',
      collection: colName,
      recordId: id,
      justification,
      timestamp: new Date().toISOString(),
      user: getActiveUserEmail(),
      data: itemData // Preserve the deleted data in the log
    }));
    
    // Delete original record
    batch.delete(docRef);
    
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${colName}/${id}`);
  }
}

/**
 * Isolated Application Config
 * Each ownerId has their own 'global' doc in 'configuracoes'
 */
export async function setAppConfig(ownerId: string, data: any): Promise<void> {
  const docRef = doc(db, 'configuracoes', ownerId);
  try {
    const userEmail = getActiveUserEmail();
    const now = new Date().toISOString();
    const sanitizedData = sanitizeData({
      ...data,
      id: ownerId,
      ownerId,
      updatedAt: now
    });
    await setDoc(docRef, sanitizedData);

    // Audit log
    const logRef = doc(collection(db, 'logs'));
    await setDoc(logRef, sanitizeData({
      id: logRef.id,
      ownerId,
      operation: 'UPDATE',
      collection: 'configuracoes',
      recordId: ownerId,
      justification: 'Atualizou as configurações da empresa',
      timestamp: now,
      user: userEmail,
      data: { name: sanitizedData.companyName || sanitizedData.tradingName || 'Configurações' }
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `configuracoes/${ownerId}`);
  }
}

export async function getAppConfig(ownerId: string): Promise<any> {
  const docRef = doc(db, 'configuracoes', ownerId);
  try {
    const snap = await getDoc(docRef);
    return snap.exists() ? snap.data() : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.READ, `configuracoes/${ownerId}`);
    return null;
  }
}

