import { create } from 'zustand';
import type { OptimizationItem } from '@/data/optimizationData';
import { api, CategoryItem } from '@/api/optimizationApi';

export interface OptimizationStore {
  items: OptimizationItem[];
  categories: CategoryItem[];
  abbrMap: Record<string, string>;
  loading: boolean;

  load: () => Promise<void>;
  addItem: (item: Omit<OptimizationItem, 'id'>) => Promise<void>;
  updateItem: (id: string | number, updates: Partial<Omit<OptimizationItem, 'id'>>) => Promise<void>;
  deleteItem: (id: string | number) => Promise<void>;
  addCategory: (name: string, abbr: string) => Promise<void>;
  renameCategory: (oldName: string, newName: string) => Promise<void>;
  deleteCategory: (name: string) => Promise<void>;
}

export const useOptimizationStore = create<OptimizationStore>((set, get) => ({
  items: [],
  categories: [],
  abbrMap: {},
  loading: false,

  load: async () => {
    set({ loading: true });
    try {
      const [items, categories] = await Promise.all([
        api.getItems(),
        api.getCategories(),
      ]);
      const abbrMap: Record<string, string> = {};
      categories.forEach((c: CategoryItem) => { abbrMap[c.name] = c.abbr; });
      set({ items, categories, abbrMap, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  addItem: async (item) => {
    const created = await api.addItem(item);
    set((state) => ({ items: [...state.items, created] }));
  },

  updateItem: async (id, updates) => {
    const updated = await api.updateItem(id, updates);
    set((state) => ({
      items: state.items.map((i) => (i.id === id ? updated : i)),
    }));
  },

  deleteItem: async (id) => {
    await api.deleteItem(id);
    set((state) => ({ items: state.items.filter((i) => i.id !== id) }));
  },

  addCategory: async (name, abbr) => {
    const state = get();
    if (state.abbrMap[name]) return;
    const cat = await api.addCategory({ name, abbr });
    set((s) => ({
      categories: [...s.categories, cat],
      abbrMap: { ...s.abbrMap, [cat.name]: cat.abbr },
    }));
  },

  renameCategory: async (oldName, newName) => {
    const state = get();
    await api.renameCategory(oldName, newName);
    const newAbbrMap = { ...state.abbrMap };
    if (newAbbrMap[oldName]) {
      newAbbrMap[newName] = newAbbrMap[oldName];
      delete newAbbrMap[oldName];
    }
    set({
      items: state.items.map((i) => (i.category === oldName ? { ...i, category: newName } : i)),
      categories: state.categories.map((c) => (c.name === oldName ? { ...c, name: newName } : c)),
      abbrMap: newAbbrMap,
    });
  },

  deleteCategory: async (name) => {
    const state = get();
    await api.deleteCategory(name);
    const newAbbrMap = { ...state.abbrMap };
    delete newAbbrMap[name];
    set({
      items: state.items.filter((i) => i.category !== name),
      categories: state.categories.filter((c) => c.name !== name),
      abbrMap: newAbbrMap,
    });
  },
}));
