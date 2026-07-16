class CacheService {
  private updateListeners: Set<() => void> = new Set();
  private swRegistration: ServiceWorkerRegistration | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    }
  }

  registerServiceWorker() {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          this.swRegistration = registration;
          console.log('Service Worker registered successfully:', registration);

          if (registration.waiting) {
            this.notifyUpdateAvailable();
          }

          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  this.notifyUpdateAvailable();
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    });
  }

  subscribeUpdate(callback: () => void): () => void {
    this.updateListeners.add(callback);
    return () => {
      this.updateListeners.delete(callback);
    };
  }

  private notifyUpdateAvailable() {
    this.updateListeners.forEach((cb) => cb());
  }

  applyUpdate() {
    if (this.swRegistration && this.swRegistration.waiting) {
      this.swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  }
}

export const cacheService = new CacheService();
export default cacheService;
