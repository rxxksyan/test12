import { DeliveriesResponse, DeliveryResponse, DeliveryFormData } from '../types/index_delivery';

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

export const apiDelivery = {
  // Получить все доставки пользователя
  getDeliveries: (): Promise<DeliveriesResponse> => 
    request('/delivery'),

  // Получить доставку по ID
  getDelivery: (id: string): Promise<DeliveryResponse> => 
    request(`/delivery/${id}`),

  // Создать доставку
  createDelivery: (formData: DeliveryFormData): Promise<DeliveryResponse> =>
    request('/delivery', {
      method: 'POST',
      body: JSON.stringify(formData),
    }),

  // Отменить доставку
  cancelDelivery: (id: string): Promise<DeliveryResponse> =>
    request(`/delivery/${id}`, {
      method: 'DELETE',
    }),
};