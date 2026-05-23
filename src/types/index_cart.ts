import { Product } from './index_catalog';

export interface CartItem {
  productId: number;
  quantity: number;
  product: Product;
}

export interface Cart {
  userId: string;
  items: CartItem[];
  updatedAt: string;
}

export interface CartResponse {
  cart: Cart | { items: CartItem[] };
  total: number;
  message?: string;
}

export interface CartCountResponse {
  count: number;
}