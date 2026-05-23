import { Router } from 'express';
import { 
  getCart, 
  addItemToCart, 
  updateItemQuantity, 
  removeItemFromCart, 
  clearUserCart,
  getCartItemCount 
} from '../controllers/controller_cart';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

router.get('/', requireAuth, getCart);

router.get('/count', getCartItemCount);

router.post('/', requireAuth, addItemToCart);

router.put('/', requireAuth, updateItemQuantity);

router.delete('/:productId', requireAuth, removeItemFromCart);

router.delete('/', requireAuth, clearUserCart);

export default router;