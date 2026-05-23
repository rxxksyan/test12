// Типы для доставки

export interface DeliveryItem {
  productId: number;
  productName: string;
  productImg: string;
  quantity: number;
  price: number;
}

export interface Delivery {
  id: string;
  userId: string;
  items: DeliveryItem[];
  totalPrice: number;
  address: string;
  phone: string;
  email: string;
  paymentMethod: 'card' | 'cash';
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface DeliveryFormData {
  address: string;
  phone: string;
  email: string;
  paymentMethod: 'card' | 'cash';
}

export interface DeliveriesResponse {
  deliveries: Delivery[];
}

export interface DeliveryResponse {
  delivery: Delivery;
  message?: string;
}