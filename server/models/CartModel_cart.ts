import fs from 'fs/promises';
import path from 'path';
import { Product, getProductById } from './ProductModel_catalog';

const CARTS_FILE = path.join(__dirname, '../../carts.json');

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

export async function readCarts(): Promise<Cart[]> {
  try {
    const data = await fs.readFile(CARTS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export async function writeCarts(carts: Cart[]): Promise<void> {
  await fs.writeFile(CARTS_FILE, JSON.stringify(carts, null, 2));
}

export async function getCartByUserId(userId: string): Promise<Cart | undefined> {
  const carts = await readCarts();
  return carts.find(c => c.userId === userId);
}

export async function createCart(userId: string): Promise<Cart> {
  const carts = await readCarts();
  const newCart: Cart = {
    userId,
    items: [],
    updatedAt: new Date().toISOString()
  };
  carts.push(newCart);
  await writeCarts(carts);
  return newCart;
}

export async function getOrCreateCart(userId: string): Promise<Cart> {
  let cart = await getCartByUserId(userId);
  if (!cart) {
    cart = await createCart(userId);
  }
  return cart;
}

export async function addToCart(userId: string, productId: number, quantity: number = 1): Promise<Cart> {
  const carts = await readCarts();
  let cart = carts.find(c => c.userId === userId);
  
  if (!cart) {
    cart = {
      userId,
      items: [],
      updatedAt: new Date().toISOString()
    };
    carts.push(cart);
  }

  const product = await getProductById(productId);
  if (!product) {
    throw new Error('Товар не найден');
  }

  const existingItemIndex = cart.items.findIndex(item => item.productId === productId);
  
  if (existingItemIndex >= 0) {
    cart.items[existingItemIndex].quantity += quantity;
  } else {
    cart.items.push({
      productId,
      quantity,
      product
    });
  }
  
  cart.updatedAt = new Date().toISOString();
  await writeCarts(carts);
  
  return cart;
}

export async function updateCartItemQuantity(userId: string, productId: number, quantity: number): Promise<Cart> {
  const carts = await readCarts();
  const cart = carts.find(c => c.userId === userId);
  
  if (!cart) {
    throw new Error('Корзина не найдена');
  }

  const itemIndex = cart.items.findIndex(item => item.productId === productId);
  
  if (itemIndex === -1) {
    throw new Error('Товар не найден в корзине');
  }

  if (quantity <= 0) {
    cart.items.splice(itemIndex, 1);
  } else {
    cart.items[itemIndex].quantity = quantity;
  }
  
  cart.updatedAt = new Date().toISOString();
  await writeCarts(carts);
  
  return cart;
}

export async function removeFromCart(userId: string, productId: number): Promise<Cart> {
  const carts = await readCarts();
  const cart = carts.find(c => c.userId === userId);
  
  if (!cart) {
    throw new Error('Корзина не найдена');
  }

  cart.items = cart.items.filter(item => item.productId !== productId);
  cart.updatedAt = new Date().toISOString();
  await writeCarts(carts);
  
  return cart;
}

export async function clearCart(userId: string): Promise<void> {
  const carts = await readCarts();
  const cart = carts.find(c => c.userId === userId);
  
  if (cart) {
    cart.items = [];
    cart.updatedAt = new Date().toISOString();
    await writeCarts(carts);
  }
}

export async function getCartTotal(userId: string): Promise<number> {
  const cart = await getCartByUserId(userId);
  if (!cart) return 0;
  
  return cart.items.reduce((total, item) => total + (item.product.price * item.quantity), 0);
}