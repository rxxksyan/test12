import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs/promises';
import { 
  getAllProducts, 
  getProductById, 
  getFilteredProducts, 
  getAvailableNations,
  getAvailableTypes,
  getAvailableLevels,
  addProduct,
  updateProduct,
  deleteProduct,
  ProductFilters,
  Product
} from '../models/ProductModel_catalog';
import { addLikedTags, getUserLikedTags, readUsers, hasLikedProduct, addLikedProduct, getUserLikedProductIds } from '../models/UserModel';
import { getReviewsByProductId, addReview, getAverageRating, hasUserReviewedProduct } from '../models/ReviewModel';
import { getUserId } from '../middleware/authMiddleware';

const IMAGES_DIR = path.join(__dirname, '../../public/images');

export async function getProducts(req: Request, res: Response) {
  try {
    const { search, nation, type, level, inStock, sortBy } = req.query;

    const filters: ProductFilters = {
      search: search as string,
      nation: nation as string,
      type: type as string,
      level: level ? parseInt(level as string) : undefined,
      inStock: inStock === 'true' ? true : inStock === 'false' ? false : undefined,
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

export async function createProduct(req: Request, res: Response) {
  try {
    const { name, nation, type, level, price, hp, dmg, dpm, ptrs, ptrp, spw, inStock, description } = req.body;

    if (!name || !nation || !type || !level || !price) {
      return res.status(400).json({ message: 'Не все обязательные поля заполнены' });
    }

    let img = req.body.img || '';
    if (req.file) {
      img = 'images/' + req.file.filename;
    }

    const autoTags: string[] = [];
    const n = (nation || '').toLowerCase();
    const t = (type || '').toLowerCase();
    const lvl = parseInt(level) || 8;
    if (n) autoTags.push(n);
    if (t) autoTags.push(t);
    autoTags.push(`t${lvl}`);
    autoTags.push('premium');

    const product = await addProduct({
      name,
      nation,
      type,
      level: lvl,
      img,
      price: parseInt(price),
      inStock: inStock !== undefined ? inStock === 'true' : true,
      hp: hp || '0',
      dmg: dmg || '0',
      dpm: dpm || '0',
      ptrs: ptrs || '0',
      ptrp: ptrp || '0',
      spw: spw || '0',
      description: description || '',
      tags: autoTags
    });

    res.status(201).json({ message: 'Товар создан', product });
  } catch (err: unknown) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка при создании товара' });
  }
}

export async function editProduct(req: Request, res: Response) {
  try {
    const id = parseInt(String(req.params.id));
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Некорректный ID товара' });
    }

    const updates: Partial<Product> = {};
    const fields: (keyof Product)[] = ['name', 'nation', 'type', 'hp', 'dmg', 'dpm', 'ptrs', 'ptrp', 'spw', 'description'];
    for (const field of fields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }
    if (req.body.level !== undefined) updates.level = parseInt(req.body.level);
    if (req.body.price !== undefined) updates.price = parseInt(req.body.price);
    if (req.body.inStock !== undefined) updates.inStock = req.body.inStock === 'true';
    if (req.body.tags !== undefined) updates.tags = req.body.tags;

    if (req.file) {
      updates.img = 'images/' + req.file.filename;
    }

    const product = await updateProduct(id, updates);
    if (!product) {
      return res.status(404).json({ message: 'Товар не найден' });
    }

    res.json({ message: 'Товар обновлён', product });
  } catch (err: unknown) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка при обновлении товара' });
  }
}

export async function removeProductImage(req: Request, res: Response) {
  try {
    const id = parseInt(String(req.params.id));
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Некорректный ID товара' });
    }

    const product = await getProductById(id);
    if (!product) {
      return res.status(404).json({ message: 'Товар не найден' });
    }

    if (product.img && product.img.startsWith('images/')) {
      const filePath = path.join(IMAGES_DIR, path.basename(product.img));
      await fs.unlink(filePath).catch(() => {});
    }

    await updateProduct(id, { img: '' });

    res.json({ message: 'Фото удалено' });
  } catch (err: unknown) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка при удалении фото' });
  }
}

export async function removeProduct(req: Request, res: Response) {
  try {
    const id = parseInt(String(req.params.id));
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Некорректный ID товара' });
    }

    const deleted = await deleteProduct(id);
    if (!deleted) {
      return res.status(404).json({ message: 'Товар не найден' });
    }

    res.json({ message: 'Товар удалён' });
  } catch (err: unknown) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка при удалении товара' });
  }
}

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
    if (comment.length > 5000) {
      return res.status(400).json({ message: 'Комментарий слишком длинный' });
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

export async function likeProduct(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: 'Не авторизован' });
    }

    const id = parseInt(String(req.params.id));
    if (isNaN(id) || id < 1) {
      return res.status(400).json({ message: 'Некорректный ID товара' });
    }

    const product = await getProductById(id);
    if (!product) {
      return res.status(404).json({ message: 'Товар не найден' });
    }

    const alreadyLiked = await hasLikedProduct(userId, id);
    if (alreadyLiked) {
      return res.status(409).json({ message: 'Вы уже оценили этот товар' });
    }

    await addLikedProduct(userId, id);

    if (product.tags && product.tags.length > 0) {
      await addLikedTags(userId, product.tags);
    }

    req.session.recommendationsAt = Date.now();

    const likesCount = (product.likesCount || 0) + 1;
    await updateProduct(id, { likesCount });

    res.json({ message: 'Товар добавлен в рекомендованные', likesCount });
  } catch (err: unknown) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка при добавлении в рекомендованные' });
  }
}

export async function getRecommendedProducts(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.json({ products: [] });
    }

    const likedTags = await getUserLikedTags(userId);
    if (likedTags.length === 0) {
      return res.json({ products: [] });
    }

    const likedProductIds = await getUserLikedProductIds(userId);

    const allProducts = await getAllProducts();
    const recommended = allProducts
      .filter(p => {
        if (!p.tags) return false;
        if (likedProductIds.includes(p.id)) return false;
        return p.tags.some(tag => likedTags.includes(tag));
      })
      .map(p => ({
        ...p,
        _commonTags: p.tags!.filter(tag => likedTags.includes(tag)).length
      }))
      .sort((a, b) => {
        if (b._commonTags !== a._commonTags) return b._commonTags - a._commonTags;
        return (b.likesCount || 0) - (a.likesCount || 0);
      })
      .slice(0, 6);

    res.json({ products: recommended });
  } catch (err: unknown) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка при получении рекомендаций' });
  }
}
