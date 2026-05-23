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
  tags?: string[];
  likesCount?: number;
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

  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    products = products.filter(p => 
      p.name.toLowerCase().includes(searchLower) ||
      (p.description && p.description.toLowerCase().includes(searchLower))
    );
  }

  if (filters.nation) {
    products = products.filter(p => p.nation === filters.nation);
  }

  if (filters.type) {
    products = products.filter(p => p.type === filters.type);
  }

  if (filters.level) {
    products = products.filter(p => p.level === filters.level);
  }

  if (filters.inStock !== undefined) {
    products = products.filter(p => p.inStock === filters.inStock);
  }

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

export async function writeProducts(products: Product[]): Promise<void> {
  const fs = await import('fs/promises');
  await fs.writeFile(PRODUCTS_FILE, JSON.stringify(products, null, 2));
}

export async function addProduct(product: Omit<Product, 'id'>): Promise<Product> {
  const products = await readProducts();
  const maxId = products.reduce((max, p) => Math.max(max, p.id), 0);
  const newProduct: Product = {
    ...product,
    id: maxId + 1,
    tags: product.tags || []
  };
  products.push(newProduct);
  await writeProducts(products);
  return newProduct;
}

export async function updateProduct(id: number, updates: Partial<Product>): Promise<Product | undefined> {
  const products = await readProducts();
  const index = products.findIndex(p => p.id === id);
  if (index === -1) return undefined;

  products[index] = { ...products[index], ...updates, id };
  await writeProducts(products);
  return products[index];
}

export async function deleteProduct(id: number): Promise<boolean> {
  const products = await readProducts();
  const index = products.findIndex(p => p.id === id);
  if (index === -1) return false;

  products.splice(index, 1);
  await writeProducts(products);
  return true;
}
