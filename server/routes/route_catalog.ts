import { Router } from 'express';
import { 
  getProducts, getProduct, getFilters, searchProducts, 
  likeProduct, getRecommendedProducts,
  createProduct, editProduct, removeProduct,
  getProductReviews, addProductReview,
  removeProductImage
} from '../controllers/controller_catalog';
import { requireAuth } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';
import { upload } from '../middleware/uploadMiddleware';

const router = Router();

router.get('/', getProducts);
router.get('/filters', getFilters);
router.get('/search', searchProducts);
router.get('/recommended', getRecommendedProducts);
router.get('/:id', getProduct);
router.get('/:id/reviews', getProductReviews);
router.post('/:id/reviews', requireAuth, addProductReview);
router.post('/', requireAuth, requireRole('admin', 'owner'), upload.single('image'), createProduct);
router.put('/:id', requireAuth, requireRole('admin', 'owner'), upload.single('image'), editProduct);
router.delete('/:id', requireAuth, requireRole('admin', 'owner'), removeProduct);
router.post('/:id/like', requireAuth, likeProduct);
router.delete('/:id/image', requireAuth, requireRole('admin', 'owner'), removeProductImage);

export default router;
