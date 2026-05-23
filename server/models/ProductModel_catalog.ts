import fs from 'fs/promises';
import path from 'path';

const PRODUCTS_FILE = path.join(__dirname, '../../tanks.json');

export interface Product {
  id: number;
  name: string;
  nation: string;
  type: string;
  level: number;
  img: string;
  price: number;
  inStock: boolean;
  hp: string;
  dmg: string;
  dpm: string;
  ptrs: string;
  ptrp: string;
  spw: string;
  description?: string;
}

export interface ProductFilters {
  search?: string;
  nation?: string;
  type?: string;
  level?: number;
  inStock?: boolean;
  sortBy?: 'price-asc' | 'price-desc';
}

export async function readProducts(): Promise<Product[]> {
  try {
    const data = await fs.readFile(PRODUCTS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export async function getAllProducts(): Promise<Product[]> {
  return readProducts();
}

export async function getProductById(id: number): Promise<Product | undefined> {
  const products = await readProducts();
  return products.find(p => p.id === id);
}

export async function getFilteredProducts(filters: ProductFilters): Promise<Product[]> {
  let products = await readProducts();

  // Поиск по названию/описанию
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    products = products.filter(p => 
      p.name.toLowerCase().includes(searchLower) ||
      (p.description && p.description.toLowerCase().includes(searchLower))
    );
  }

  // Фильтр по нации
  if (filters.nation) {
    products = products.filter(p => p.nation === filters.nation);
  }

  // Фильтр по типу
  if (filters.type) {
    products = products.filter(p => p.type === filters.type);
  }

  // Фильтр по уровню
  if (filters.level) {
    products = products.filter(p => p.level === filters.level);
  }

  // Фильтр по наличию
  if (filters.inStock !== undefined) {
    products = products.filter(p => p.inStock === filters.inStock);
  }

  // Сортировка по цене
  if (filters.sortBy === 'price-asc') {
    products.sort((a, b) => a.price - b.price);
  } else if (filters.sortBy === 'price-desc') {
    products.sort((a, b) => b.price - a.price);
  }

  return products;
}

export async function getAvailableNations(): Promise<string[]> {
  const products = await readProducts();
  const nations = [...new Set(products.map(p => p.nation))];
  return nations.sort();
}

export async function getAvailableTypes(): Promise<string[]> {
  const products = await readProducts();
  const types = [...new Set(products.map(p => p.type))];
  return types.sort();
}

export async function getAvailableLevels(): Promise<number[]> {
  const products = await readProducts();
  const levels = [...new Set(products.map(p => p.level))];
  return levels.sort((a, b) => a - b);
}