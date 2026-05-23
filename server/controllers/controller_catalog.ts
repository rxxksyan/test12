import { Request, Response } from 'express';
import { 
  getAllProducts, 
  getProductById, 
  getFilteredProducts, 
  getAvailableNations,
  getAvailableTypes,
  getAvailableLevels,
  ProductFilters,
  Product
} from '../models/ProductModel_catalog';
import { getReviewsByProductId, addReview, getAverageRating, hasUserReviewedProduct } from '../models/ReviewModel';
import { getUserId } from '../middleware/authMiddleware';
import { readUsers } from '../models/UserModel';

export async function getProducts(req: Request, res: Response) {
  try {
    const { search, nation, type, level, inStock, sortBy } = req.query;

    const filters: ProductFilters = {
      search: search as string,
      nation: nation as string,
      type: type as string,
      level: level ? parseInt(level as string) : undefined,
      inStock: inStock !== undefined ? inStock : undefined,
      sortBy: sortBy as 'price-asc' | 'price-desc'
    };

    const hasFilters = Object.values(filters).some(v => v !== undefined);
    
    let products;
    if (hasFilters) {
      products = await getFilteredProducts(filters);
    } else {
      products = await getAllProducts();
    }

    res.json({ products });
  } catch (err: unknown) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка при получении товаров' });
  }
}

export async function getProduct(req: Request, res: Response) {
  try {
    const id = parseInt(String(req.params.id));
    
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Некорректный ID товара' });
    }

    const product = await getProductById(id);
    
    if (!product) {
      return res.status(404).json({ message: 'Товар не найден' });
    }

    res.json({ product });
  } catch (err: unknown) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка при получении товара' });
  }
}

export async function getFilters(req: Request, res: Response) {
  try {
    const [nations, types, levels] = await Promise.all([
      getAvailableNations(),
      getAvailableTypes(),
      getAvailableLevels()
    ]);

    res.json({ 
      filters: {
        nations,
        types,
        levels
      }
    });
  } catch (err: unknown) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка при получении фильтров' });
  }
}

export async function searchProducts(req: Request, res: Response) {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ message: 'Не указан поисковый запрос' });
    }

    const searchQuery = Array.isArray(q) ? q[0] : q;
    const products = await getFilteredProducts({ search: String(searchQuery) });

    res.json({ products });
  } catch (err: unknown) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка при поиске товаров' });
  }
}

// ======== P2: REVIEWS ========

export async function getProductReviews(req: Request, res: Response) {
  try {
    const id = parseInt(String(req.params.id));
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Некорректный ID товара' });
    }

    const [reviews, averageRating] = await Promise.all([
      getReviewsByProductId(id),
      getAverageRating(id)
    ]);

    res.json({ reviews, averageRating });
  } catch (err: unknown) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка при получении отзывов' });
  }
}

export async function addProductReview(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: 'Не авторизован' });
    }

    const id = parseInt(String(req.params.id));
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Некорректный ID товара' });
    }

    const product = await getProductById(id);
    if (!product) {
      return res.status(404).json({ message: 'Товар не найден' });
    }

    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Оценка должна быть от 1 до 5' });
    }

    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({ message: 'Комментарий не может быть пустым' });
    }

    const alreadyReviewed = await hasUserReviewedProduct(userId, id);
    if (alreadyReviewed) {
      return res.status(409).json({ message: 'Вы уже оставили отзыв на этот товар' });
    }

    const users = await readUsers();
    const user = users.find(u => u.id === userId);

    const review = await addReview({
      productId: id,
      userId,
      userName: user?.nickname || 'Unknown',
      rating: parseInt(rating),
      comment: comment.trim()
    });

    res.status(201).json({ message: 'Отзыв добавлен', review });
  } catch (err: unknown) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка при добавлении отзыва' });
  }
}
