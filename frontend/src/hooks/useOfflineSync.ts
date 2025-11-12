import { useEffect, useState, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { apiClient } from '@/lib/api';

interface SyncQueueItem {
  id: string;
  entityType: string;
  entityId: string;
  operation: string;
  payload: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(true);
  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.auth.token);

  // Check online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load sync queue from IndexedDB
  useEffect(() => {
    // TODO: Load from IndexedDB
    // This would use Dexie.js to load pending sync items
  }, []);

  // Add item to sync queue
  const addToSyncQueue = useCallback((item: Omit<SyncQueueItem, 'id' | 'status'>) => {
    const syncItem: SyncQueueItem = {
      ...item,
      id: `${Date.now()}-${Math.random()}`,
      status: 'pending',
    };

    setSyncQueue((prev) => [...prev, syncItem]);

    // Save to IndexedDB
    // TODO: Save to IndexedDB using Dexie.js

    // Try to sync immediately if online
    if (isOnline && token) {
      sync();
    }
  }, [isOnline, token]);

  // Process sync queue
  const sync = useCallback(async () => {
    if (!isOnline || !token || isSyncing || syncQueue.length === 0) {
      return;
    }

    setIsSyncing(true);
    apiClient.setToken(token);

    try {
      const pendingItems = syncQueue.filter((item) => item.status === 'pending');

      for (const item of pendingItems) {
        try {
          setSyncQueue((prev) =>
            prev.map((i) =>
              i.id === item.id ? { ...i, status: 'processing' } : i
            )
          );

          // Process based on entity type and operation
          switch (item.entityType) {
            case 'audit':
              if (item.operation === 'create') {
                await apiClient.post('/v1/audits', item.payload);
              } else if (item.operation === 'update') {
                await apiClient.patch(`/v1/audits/${item.entityId}`, item.payload);
              }
              break;
            case 'issue':
              if (item.operation === 'create') {
                await apiClient.post('/v1/issues', item.payload);
              }
              break;
            // Add more entity types as needed
          }

          setSyncQueue((prev) =>
            prev.map((i) =>
              i.id === item.id ? { ...i, status: 'completed' } : i
            )
          );

          // Remove from IndexedDB
          // TODO: Remove from IndexedDB
        } catch (error) {
          console.error(`Sync failed for item ${item.id}:`, error);
          setSyncQueue((prev) =>
            prev.map((i) =>
              i.id === item.id ? { ...i, status: 'failed' } : i
            )
          );
        }
      }
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, token, isSyncing, syncQueue]);

  // Auto-sync when coming online
  useEffect(() => {
    if (isOnline && token && syncQueue.length > 0) {
      sync();
    }
  }, [isOnline, token, syncQueue.length, sync]);

  return {
    isOnline,
    syncQueue,
    isSyncing,
    addToSyncQueue,
    sync,
  };
}

