import { useState, useEffect } from 'react';
import { syncService, SyncStatus } from '../services/SyncService';
import { useOnlineStatus } from './useOnlineStatus';

export function useSync(ownerId?: string, collectionsList?: string[]) {
  const isOnline = useOnlineStatus();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(syncService.getStatus());

  useEffect(() => {
    return syncService.subscribeStatus((status) => {
      setSyncStatus(status);
    });
  }, []);

  const triggerSync = async () => {
    if (isOnline) {
      await syncService.sync(ownerId, collectionsList);
    }
  };

  useEffect(() => {
    if (isOnline && ownerId && collectionsList) {
      triggerSync();
    }
  }, [isOnline, ownerId]);

  return {
    isOnline,
    syncStatus,
    triggerSync,
    statusMessage: syncStatus === 'syncing' 
      ? 'Sincronizando...' 
      : syncStatus === 'error'
      ? 'Erro ao sincronizar'
      : 'Todos os dados sincronizados'
  };
}
