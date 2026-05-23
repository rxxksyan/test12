import { ProductsResponse, ProductResponse, FiltersResponse } from '../types/index_catalog';

const API_BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Something went wrong');
  }
  return data as T;
}

export const apiCatalog = {
  // Получить все товары
  getProducts: (params?: { 
    search?: string; 
    nation?: string; 
    type?: string; 
    level?: number; 
    inStock?: boolean;
    sortBy?: 'price-asc' | 'price-desc';
  }): Promise<ProductsResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.nation) queryParams.append('nation', params.nation);
    if (params?.type) queryParams.append('type', params.type);
    if (params?.level) queryParams.append('level', params.level.toString());
    if (params?.inStock !== undefined) queryParams.append('inStock', params.inStock.toString());
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    
    const queryString = queryParams.toString();
    return request(`/catalog${queryString ? `?${queryString}` : ''}`);
  },

  // Получить товар по ID
  getProduct: (id: number): Promise<ProductResponse> => 
    request(`/catalog/${id}`),

  // Получить доступные фильтры
  getFilters: (): Promise<FiltersResponse> => 
    request('/catalog/filters'),

  // Поиск товаров
  searchProducts: (query: string): Promise<ProductsResponse> => 
    request(`/catalog/search?q=${encodeURIComponent(query)}`),
};