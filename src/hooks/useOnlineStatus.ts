import { useState, useEffect } from 'react';
import { networkService } from '../services/NetworkService';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(networkService.isOnline());

  useEffect(() => {
    return networkService.subscribe((status) => {
      setIsOnline(status);
    });
  }, []);

  return isOnline;
}
