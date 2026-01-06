import { QRConfig, HistoryItem } from '../types';

const HISTORY_KEY = 'quickqr_history';
const MAX_HISTORY = 10;

export const saveToHistory = (config: QRConfig, type: string, name: string) => {
  try {
    const historyJson = localStorage.getItem(HISTORY_KEY);
    let history: HistoryItem[] = historyJson ? JSON.parse(historyJson) : [];
    
    const newItem: HistoryItem = {
      id: crypto.randomUUID(),
      date: Date.now(),
      type,
      name: name || 'Untitled',
      config: { ...config } 
    };

    history.unshift(newItem);
    
    if (history.length > MAX_HISTORY) {
      history = history.slice(0, MAX_HISTORY);
    }

    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    return history;
  } catch (e) {
    console.error('Failed to save history', e);
    return [];
  }
};

export const getHistory = (): HistoryItem[] => {
  try {
    const historyJson = localStorage.getItem(HISTORY_KEY);
    return historyJson ? JSON.parse(historyJson) : [];
  } catch (e) {
    return [];
  }
};

export const clearHistory = () => {
  localStorage.removeItem(HISTORY_KEY);
};