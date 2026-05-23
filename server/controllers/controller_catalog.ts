import { Request, Response } from 'express';
import { 
  getAllProducts, 
  getProductById, 
  getFilteredProducts, 
  getAvailableNations,
  getAvailableTypes,
  getAvailableLevels,
  ProductFilters 
} from '../models/ProductModel_catalog';

// Получить все товары
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

    // Если фильтры пустые, возвращаем все товары
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

// Получить товар по ID
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

// Получить доступные фильтры
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

// Поиск товаров
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
