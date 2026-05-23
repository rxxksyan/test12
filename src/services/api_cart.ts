import { CartResponse, CartCountResponse } from '../types/index_cart';

const API_BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Something went wrong');
  }
  return data as T;
}

export const apiCart = {
  getCart: (): Promise<CartResponse> => 
    request('/cart'),

  getCartCount: (): Promise<CartCountResponse> => 
    request('/cart/count'),

  addToCart: (productId: number, quantity: number = 1): Promise<CartResponse> =>
    request('/cart', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity }),
    }),

  updateQuantity: (productId: number, quantity: number): Promise<CartResponse> =>
    request('/cart', {
      method: 'PUT',
      body: JSON.stringify({ productId, quantity }),
    }),

  removeFromCart: (productId: number): Promise<CartResponse> =>
    request(`/cart/${productId}`, {
      method: 'DELETE',
    }),

  clearCart: (): Promise<{ message: string }> =>
    request('/cart', {
      method: 'DELETE',
    }),
};