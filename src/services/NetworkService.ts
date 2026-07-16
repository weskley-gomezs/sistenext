class NetworkService {
  private listeners: Set<(isOnline: boolean) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.notify(true));
      window.addEventListener('offline', () => this.notify(false));
    }
  }

  isOnline(): boolean {
    if (typeof navigator === 'undefined') return true;
    return navigator.onLine;
  }

  subscribe(callback: (isOnline: boolean) => void): () => void {
    this.listeners.add(callback);
    // Call immediately with current status
    callback(this.isOnline());
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notify(isOnline: boolean) {
    this.listeners.forEach((callback) => callback(isOnline));
  }
}

export const networkService = new NetworkService();
