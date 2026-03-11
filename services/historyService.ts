export interface SearchHistoryItem {
  id: string;
  topic: string;
  format: string;
  timestamp: number;
}

const STORAGE_KEY = 'typemaster_ai_search_history';

export const historyService = {
  getHistory: (): SearchHistoryItem[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error("Failed to load history", e);
      return [];
    }
  },

  addToHistory: (topic: string, format: string): SearchHistoryItem[] => {
    if (!topic.trim()) return historyService.getHistory();
    
    try {
      const current = historyService.getHistory();
      // Remove duplicates to keep list clean (same topic AND format)
      const filtered = current.filter(item => 
        !(item.topic.toLowerCase() === topic.trim().toLowerCase() && item.format === format)
      );
      
      const newItem: SearchHistoryItem = {
        id: Date.now().toString(),
        topic: topic.trim(),
        format,
        timestamp: Date.now()
      };

      // Store most recent first, limit to last 20 items
      const updated = [newItem, ...filtered].slice(0, 20);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.error("Failed to save history", e);
      return [];
    }
  },

  deleteItem: (id: string): SearchHistoryItem[] => {
    try {
      const current = historyService.getHistory();
      const updated = current.filter(item => item.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    } catch (e) {
      return [];
    }
  },

  clearHistory: (): SearchHistoryItem[] => {
    localStorage.removeItem(STORAGE_KEY);
    return [];
  }
};