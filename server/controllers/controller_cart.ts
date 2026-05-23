import { Request, Response } from 'express';
import { 
  getCartByUserId, 
  addToCart, 
  updateCartItemQuantity, 
  removeFromCart, 
  clearCart,
  getCartTotal 
} from '../models/CartModel_cart';
import { getUserId } from '../middleware/authMiddleware';

export async function getCart(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    
    if (!userId) {
      return res.status(401).json({ message: 'Не авторизован' });
    }

    const cart = await getCartByUserId(userId);
    const total = await getCartTotal(userId);

    res.json({ 
      cart: cart || { items: [] },
      total 
    });
  } catch (err: unknown) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка при получении корзины' });
  }
}

export async function addItemToCart(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    
    if (!userId) {
      return res.status(401).json({ message: 'Не авторизован' });
    }

    const { productId, quantity } = req.body;

    if (!productId) {
      return res.status(400).json({ message: 'Не указан ID товара' });
    }

    const qty = typeof quantity === 'string' ? parseInt(quantity) : (quantity || 1);
    const cart = await addToCart(userId, parseInt(productId), qty);
    const total = await getCartTotal(userId);

    res.json({ 
      message: 'Товар добавлен в корзину',
      cart,
      total 
    });
  } catch (err: unknown) {
    console.error(err);
    const errorMessage = err instanceof Error ? err.message : 'Ошибка при добавлении товара';
    res.status(500).json({ message: errorMessage });
  }
}

export async function updateItemQuantity(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    
    if (!userId) {
      return res.status(401).json({ message: 'Не авторизован' });
    }

    const { productId, quantity } = req.body;

    if (!productId || quantity === undefined) {
      return res.status(400).json({ message: 'Не указан ID товара или количество' });
    }

    const qty = typeof quantity === 'string' ? parseInt(quantity) : quantity;
    const cart = await updateCartItemQuantity(userId, parseInt(productId), qty);
    const total = await getCartTotal(userId);

    res.json({ 
      message: 'Количество обновлено',
      cart,
      total 
    });
  } catch (err: unknown) {
    console.error(err);
    const errorMessage = err instanceof Error ? err.message : 'Ошибка при обновлении количества';
    res.status(500).json({ message: errorMessage });
  }
}

export async function removeItemFromCart(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    
    if (!userId) {
      return res.status(401).json({ message: 'Не авторизован' });
    }

    const productId = parseInt(String(req.params.productId));

    if (isNaN(productId)) {
      return res.status(400).json({ message: 'Некорректный ID товара' });
    }

    const cart = await removeFromCart(userId, productId);
    const total = await getCartTotal(userId);

    res.json({ 
      message: 'Товар удалён из корзины',
      cart,
      total 
    });
  } catch (err: unknown) {
    console.error(err);
    const errorMessage = err instanceof Error ? err.message : 'Ошибка при удалении товара';
    res.status(500).json({ message: errorMessage });
  }
}

export async function clearUserCart(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    
    if (!userId) {
      return res.status(401).json({ message: 'Не авторизован' });
    }

    await clearCart(userId);

    res.json({ message: 'Корзина очищена' });
  } catch (err: unknown) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка при очистке корзины' });
  }
}

export async function getCartItemCount(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    
    if (!userId) {
      return res.json({ count: 0 });
    }

    const cart = await getCartByUserId(userId);
    const count = cart ? cart.items.reduce((sum, item) => sum + item.quantity, 0) : 0;

    res.json({ count });
  } catch (err: unknown) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка при получении количества товаров' });
  }
}