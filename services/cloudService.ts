import { SearchHistoryItem } from './historyService';

// Simulate network latency (e.g. 800ms)
const NETWORK_DELAY = 800; 

export const cloudService = {
  // Simulate logging into a cloud account
  connect: async (username: string): Promise<SearchHistoryItem[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const key = `typemaster_cloud_db_${username.toLowerCase()}`;
        const stored = localStorage.getItem(key);
        const history = stored ? JSON.parse(stored) : [];
        console.log(`[Cloud] Connected to account: ${username}`);
        resolve(history);
      }, NETWORK_DELAY);
    });
  },

  // Simulate uploading a new search to the cloud
  uploadItem: async (username: string, item: SearchHistoryItem): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const key = `typemaster_cloud_db_${username.toLowerCase()}`;
        // Get current "server" state
        const stored = localStorage.getItem(key);
        const currentHistory = stored ? JSON.parse(stored) : [];
        
        // Add new item to top (prevent duplicates logic handled in UI mostly, but good to be safe)
        const updated = [item, ...currentHistory.filter((i: SearchHistoryItem) => i.id !== item.id)].slice(0, 50);
        
        localStorage.setItem(key, JSON.stringify(updated));
        console.log(`[Cloud] Uploaded item: ${item.topic}`);
        resolve();
      }, 500); // Faster save than initial connect
    });
  },

  // Simulate deleting from cloud
  deleteItem: async (username: string, itemId: string): Promise<void> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const key = `typemaster_cloud_db_${username.toLowerCase()}`;
            const stored = localStorage.getItem(key);
            if (stored) {
                const list = JSON.parse(stored) as SearchHistoryItem[];
                const updated = list.filter(i => i.id !== itemId);
                localStorage.setItem(key, JSON.stringify(updated));
            }
            resolve();
        }, 300);
    })
  }
};