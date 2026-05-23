import { Router } from 'express';
import { 
  getDeliveries, 
  getDelivery, 
  createNewDelivery, 
  cancelDeliveryById 
} from '../controllers/controller_delivery';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

// Получить все доставки пользователя (только для авторизованных)
router.get('/', requireAuth, getDeliveries);

// Создать доставку (только для авторизованных)
router.post('/', requireAuth, createNewDelivery);

// Получить доставку по ID (только для авторизованных)
router.get('/:id', requireAuth, getDelivery);

// Отменить доставку (только для авторизованных)
router.delete('/:id', requireAuth, cancelDeliveryById);

export default router;