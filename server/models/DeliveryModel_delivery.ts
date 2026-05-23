import fs from 'fs/promises';
import path from 'path';
import { clearCart, getCartByUserId } from './CartModel_cart';

const DELIVERIES_FILE = path.join(__dirname, '../../deliveries.json');

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

export async function readDeliveries(): Promise<Delivery[]> {
  try {
    const data = await fs.readFile(DELIVERIES_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export async function writeDeliveries(deliveries: Delivery[]): Promise<void> {
  await fs.writeFile(DELIVERIES_FILE, JSON.stringify(deliveries, null, 2));
}

export async function getDeliveriesByUserId(userId: string): Promise<Delivery[]> {
  const deliveries = await readDeliveries();
  return deliveries.filter(d => d.userId === userId).sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getDeliveryById(id: string): Promise<Delivery | undefined> {
  const deliveries = await readDeliveries();
  return deliveries.find(d => d.id === id);
}

export async function createDelivery(userId: string, formData: DeliveryFormData): Promise<Delivery> {
  const cart = await getCartByUserId(userId);
  
  if (!cart || cart.items.length === 0) {
    throw new Error('Корзина пуста');
  }

  const deliveries = await readDeliveries();
  
  const deliveryItems: DeliveryItem[] = cart.items.map(item => ({
    productId: item.productId,
    productName: item.product.name,
    productImg: item.product.img,
    quantity: item.quantity,
    price: item.product.price
  }));

  const totalPrice = cart.items.reduce((total, item) => total + (item.product.price * item.quantity), 0);

  const newDelivery: Delivery = {
    id: Date.now().toString(),
    userId,
    items: deliveryItems,
    totalPrice,
    address: formData.address,
    phone: formData.phone,
    email: formData.email,
    paymentMethod: formData.paymentMethod,
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  deliveries.push(newDelivery);
  await writeDeliveries(deliveries);
  
  // Очищаем корзину после создания доставки
  await clearCart(userId);
  
  return newDelivery;
}

export async function updateDeliveryStatus(id: string, status: Delivery['status']): Promise<Delivery> {
  const deliveries = await readDeliveries();
  const delivery = deliveries.find(d => d.id === id);
  
  if (!delivery) {
    throw new Error('Доставка не найдена');
  }
  
  delivery.status = status;
  await writeDeliveries(deliveries);
  
  return delivery;
}

export async function cancelDelivery(id: string, userId: string): Promise<Delivery> {
  const deliveries = await readDeliveries();
  const delivery = deliveries.find(d => d.id === id && d.userId === userId);
  
  if (!delivery) {
    throw new Error('Доставка не найдена');
  }
  
  if (delivery.status !== 'pending') {
    throw new Error('Невозможно отменить доставку с текущим статусом');
  }
  
  delivery.status = 'cancelled';
  await writeDeliveries(deliveries);
  
  return delivery;
}