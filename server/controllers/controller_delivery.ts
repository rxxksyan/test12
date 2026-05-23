import { Request, Response } from 'express';
import { 
  getDeliveriesByUserId, 
  getDeliveryById, 
  createDelivery, 
  cancelDelivery,
  DeliveryFormData 
} from '../models/DeliveryModel_delivery';
import { getUserId } from '../middleware/authMiddleware';

// Получить доставки пользователя
export async function getDeliveries(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    
    if (!userId) {
      return res.status(401).json({ message: 'Не авторизован' });
    }

    const deliveries = await getDeliveriesByUserId(userId);

    res.json({ deliveries });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка при получении доставок' });
  }
}

// Получить доставку по ID
export async function getDelivery(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    
    if (!userId) {
      return res.status(401).json({ message: 'Не авторизован' });
    }

    const deliveryId = String(req.params.id);
    const delivery = await getDeliveryById(deliveryId);

    if (!delivery) {
      return res.status(404).json({ message: 'Доставка не найдена' });
    }

    if (delivery.userId !== userId) {
      return res.status(403).json({ message: 'Нет доступа к этой доставке' });
    }

    res.json({ delivery });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка при получении доставки' });
  }
}

// Создать доставку
export async function createNewDelivery(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    
    if (!userId) {
      return res.status(401).json({ message: 'Не авторизован' });
    }

    const { address, phone, email, paymentMethod } = req.body;

    if (!address || !phone || !email || !paymentMethod) {
      return res.status(400).json({ message: 'Не все поля заполнены' });
    }

    if (paymentMethod !== 'card' && paymentMethod !== 'cash') {
      return res.status(400).json({ message: 'Некорректный способ оплаты' });
    }

    const formData: DeliveryFormData = {
      address,
      phone,
      email,
      paymentMethod
    };

    const delivery = await createDelivery(userId, formData);

    res.status(201).json({ 
      message: 'Доставка оформлена успешно',
      delivery 
    });
  } catch (err) {
    console.error(err);
    const errorMessage = err instanceof Error ? err.message : 'Ошибка при оформлении доставки';
    res.status(500).json({ message: errorMessage });
  }
}

// Отменить доставку
export async function cancelDeliveryById(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    
    if (!userId) {
      return res.status(401).json({ message: 'Не авторизован' });
    }

    const deliveryId = req.params.id;
    const delivery = await cancelDelivery(deliveryId, userId);

    res.json({ 
      message: 'Доставка отменена',
      delivery 
    });
  } catch (err) {
    console.error(err);
    const errorMessage = err instanceof Error ? err.message : 'Ошибка при отмене доставки';
    res.status(500).json({ message: errorMessage });
  }
}