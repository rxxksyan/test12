import { Router } from 'express';
import { getProducts, getProduct, getFilters, searchProducts } from '../controllers/controller_catalog';

const router = Router();

// Получить все товары с фильтрацией
router.get('/', getProducts);

// Получить доступные фильтры
router.get('/filters', getFilters);

// Поиск товаров
router.get('/search', searchProducts);

// Получить товар по ID
router.get('/:id', getProduct);

export default router;