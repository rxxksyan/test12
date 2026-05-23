// Типы для каталога

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
  nations: string[];
  types: string[];
  levels: number[];
}

export interface ProductsResponse {
  products: Product[];
}

export interface ProductResponse {
  product: Product;
}

export interface FiltersResponse {
  filters: ProductFilters;
}