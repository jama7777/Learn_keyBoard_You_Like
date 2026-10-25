export interface SearchHistoryItem {
  id: string;
  topic: string;
  format: string;
  timestamp: number;
}

const STORAGE_KEY = 'typemaster_ai_search_history';

/**
 * History now lives in Postgres (see db/schema.ts `lessonHistory`, served by
 * /api/history). localStorage is kept as an offline cache so the UI still has
 * something to render before the first fetch resolves, and so it keeps working
 * for a signed-out visitor.
 */

const readCache = (): SearchHistoryItem[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Failed to load history", e);
    return [];
  }
};

const writeCache = (items: SearchHistoryItem[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Quota exceeded or storage disabled — history is still safe server-side.
  }
};

const isSignedIn = async (): Promise<boolean> => {
  try {
    const res = await fetch("/api/session", { cache: "no-store" });
    if (!res.ok) return false;
    const data = await res.json();
    return Boolean(data.user);
  } catch {
    return false;
  }
};

export const historyService = {
  getHistory: async (): Promise<SearchHistoryItem[]> => {
    if (await isSignedIn()) {
      try {
        const res = await fetch("/api/history", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          writeCache(data.items ?? []);
          return data.items ?? [];
        }
      } catch (e) {
        console.error("Failed to fetch history, using cache", e);
      }
    }
    return readCache();
  },

  addToHistory: async (topic: string, format: string): Promise<SearchHistoryItem[]> => {
    if (!topic.trim()) return historyService.getHistory();

    const current = await historyService.getHistory();
    const filtered = current.filter(item =>
      !(item.topic.toLowerCase() === topic.trim().toLowerCase() && item.format === format)
    );

    const newItem: SearchHistoryItem = {
      id: Date.now().toString(),
      topic: topic.trim(),
      format,
      timestamp: Date.now()
    };

    // Optimistic update: render the new list immediately, then persist.
    const optimistic = [newItem, ...filtered].slice(0, 50);
    writeCache(optimistic);

    if (await isSignedIn()) {
      try {
        const res = await fetch("/api/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic: newItem.topic, format }),
        });
        if (res.ok) {
          const data = await res.json();
          writeCache(data.items ?? optimistic);
          return data.items ?? optimistic;
        }
      } catch (e) {
        console.error("Failed to save history", e);
      }
    }

    return optimistic;
  },

  deleteItem: async (id: string): Promise<SearchHistoryItem[]> => {
    const current = await historyService.getHistory();
    const target = current.find(item => item.id === id);
    const updated = current.filter(item => item.id !== id);
    writeCache(updated);

    if (target && (await isSignedIn())) {
      try {
        await fetch("/api/history", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic: target.topic }),
        });
      } catch (e) {
        console.error("Failed to delete history item", e);
      }
    }

    return updated;
  },

  clearHistory: async (): Promise<SearchHistoryItem[]> => {
    localStorage.removeItem(STORAGE_KEY);
    return [];
  }
};
