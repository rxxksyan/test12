import { Router } from 'express';
import { 
  getProducts, getProduct, getFilters, searchProducts,
  getProductReviews, addProductReview
} from '../controllers/controller_catalog';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

router.get('/', getProducts);
router.get('/filters', getFilters);
router.get('/search', searchProducts);
router.get('/:id', getProduct);

// P2: REVIEWS
router.get('/:id/reviews', getProductReviews);
router.post('/:id/reviews', requireAuth, addProductReview);

export default router;
