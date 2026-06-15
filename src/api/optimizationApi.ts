import type { OptimizationItem } from '@/data/optimizationData';

const BASE = import.meta.env.DEV ? 'http://localhost:3001' : '/api';

export interface CategoryItem {
  id: string | number;
  name: string;
  abbr: string;
}

function normalizeItem(item: OptimizationItem & { id?: string | number }): OptimizationItem {
  return { ...item, id: item.id ?? 0 };
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

export const api = {
  // === 任务项 ===
  getItems: async () => {
    const data = await request<(OptimizationItem & { id?: string | number })[]>('/items');
    return data.map(normalizeItem);
  },

  addItem: async (item: Omit<OptimizationItem, 'id'>) => {
    // 获取最大数字ID，生成自增序号
    const all = await request<(OptimizationItem & { id?: string | number })[]>('/items');
    let maxId = 22; // 默认从样例数据的22开始
    all.forEach((i) => {
      const n = typeof i.id === 'string' ? parseInt(i.id, 10) : (i.id as number);
      if (!isNaN(n) && n > maxId) maxId = n;
    });
    const newId = maxId + 1;
    const data = await request<OptimizationItem & { id?: string | number }>('/items', {
      method: 'POST',
      body: JSON.stringify({ ...item, id: newId }),
    });
    return { ...data, id: newId };
  },

  updateItem: async (id: number, updates: Partial<OptimizationItem>) => {
    const data = await request<OptimizationItem & { id?: string | number }>(`/items/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    return normalizeItem(data);
  },

  deleteItem: (id: number) =>
    request<void>(`/items/${id}`, { method: 'DELETE' }),

  // === 大项 ===
  getCategories: () => request<CategoryItem[]>('/categories'),

  addCategory: (cat: Omit<CategoryItem, 'id'>) =>
    request<CategoryItem>('/categories', {
      method: 'POST',
      body: JSON.stringify(cat),
    }),

  renameCategory: async (oldName: string, newName: string) => {
    const cats = await request<CategoryItem[]>(`/categories?name=${encodeURIComponent(oldName)}`);
    if (cats.length === 0) throw new Error('Category not found');
    return request<CategoryItem>(`/categories/${cats[0].id}`, {
      method: 'PATCH',
      body: JSON.stringify({ name: newName }),
    });
  },

  deleteCategory: async (name: string) => {
    const cats = await request<CategoryItem[]>(`/categories?name=${encodeURIComponent(name)}`);
    if (cats.length === 0) return;
    return request<void>(`/categories/${cats[0].id}`, { method: 'DELETE' });
  },
};
