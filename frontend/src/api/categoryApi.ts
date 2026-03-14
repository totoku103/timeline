import type { Category } from '../types/timeline';

const BASE_URL = '/api/categories';

export async function getCategories(): Promise<Category[]> {
  const res = await fetch(BASE_URL);
  if (!res.ok) throw new Error('Failed to fetch categories');
  return res.json();
}

export async function getCategory(id: number): Promise<Category> {
  const res = await fetch(`${BASE_URL}/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch category ${id}`);
  return res.json();
}

export async function createCategory(data: Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>): Promise<Category> {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create category');
  return res.json();
}

export async function updateCategory(id: number, data: Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>): Promise<Category> {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to update category ${id}`);
  return res.json();
}

export async function deleteCategory(id: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(`Failed to delete category ${id}`);
}
