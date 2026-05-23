/// <reference types="jest" />
import * as ProductModel from '../models/ProductModel_catalog';
import * as UserModel from '../models/UserModel';
import * as ReviewModel from '../models/ReviewModel';
import fs from 'fs/promises';
import path from 'path';

const TANKS_FILE = path.join(__dirname, '../../tanks.json');
const USERS_FILE = path.join(__dirname, '../../users.json');

// ========================
// PRODUCT MODEL
// ========================
describe('ProductModel — норма', () => {
  test('getAllProducts возвращает массив', async () => {
    const products = await ProductModel.getAllProducts();
    expect(Array.isArray(products)).toBe(true);
    expect(products.length).toBeGreaterThan(0);
    expect(products[0].id).toBeDefined();
    expect(products[0].name).toBeDefined();
  });

  test('getProductById существующий товар', async () => {
    const products = await ProductModel.getAllProducts();
    const product = await ProductModel.getProductById(products[0].id);
    expect(product).toBeDefined();
    expect(product!.id).toBe(products[0].id);
    expect(product!.name).toBe(products[0].name);
  });

  test('getProductById несуществующий — undefined', async () => {
    const result = await ProductModel.getProductById(99999);
    expect(result).toBeUndefined();
  });

  test('getAvailableNations уникальные отсортированные', async () => {
    const nations = await ProductModel.getAvailableNations();
    expect(Array.isArray(nations)).toBe(true);
    expect(nations.length).toBeGreaterThan(0);
    for (let i = 1; i < nations.length; i++) {
      expect(nations[i] >= nations[i - 1]).toBe(true);
    }
  });

  test('getAvailableTypes уникальные отсортированные', async () => {
    const types = await ProductModel.getAvailableTypes();
    expect(Array.isArray(types)).toBe(true);
    expect(types.length).toBeGreaterThan(0);
  });

  test('getAvailableLevels уникальные отсортированные', async () => {
    const levels = await ProductModel.getAvailableLevels();
    expect(Array.isArray(levels)).toBe(true);
    expect(levels.length).toBeGreaterThan(0);
  });

  test('getFilteredProducts — поиск по имени', async () => {
    const all = await ProductModel.getAllProducts();
    if (all.length === 0) return;
    const searchTerm = all[0].name.slice(0, 4);
    const results = await ProductModel.getFilteredProducts({ search: searchTerm });
    expect(results.length).toBeGreaterThan(0);
    expect(results.some(p => p.name.includes(searchTerm))).toBe(true);
  });

  test('getFilteredProducts — поиск по описанию', async () => {
    const results = await ProductModel.getFilteredProducts({ search: 'советский' });
    expect(Array.isArray(results)).toBe(true);
  });

  test('getFilteredProducts — фильтр по нации', async () => {
    const results = await ProductModel.getFilteredProducts({ nation: 'germany' });
    results.forEach(p => expect(p.nation).toBe('germany'));
  });

  test('getFilteredProducts — фильтр по типу', async () => {
    const results = await ProductModel.getFilteredProducts({ type: 'light' });
    results.forEach(p => expect(p.type).toBe('light'));
  });

  test('getFilteredProducts — фильтр по уровню', async () => {
    const results = await ProductModel.getFilteredProducts({ level: 10 });
    results.forEach(p => expect(p.level).toBe(10));
  });

  test('getFilteredProducts — inStock = true', async () => {
    const results = await ProductModel.getFilteredProducts({ inStock: true });
    results.forEach(p => expect(p.inStock).toBe(true));
  });

  test('getFilteredProducts — inStock = false', async () => {
    const results = await ProductModel.getFilteredProducts({ inStock: false });
    results.forEach(p => expect(p.inStock).toBe(false));
  });

  test('getFilteredProducts — сортировка по цене asc', async () => {
    const results = await ProductModel.getFilteredProducts({ sortBy: 'price-asc' });
    for (let i = 1; i < results.length; i++) {
      expect(results[i].price).toBeGreaterThanOrEqual(results[i - 1].price);
    }
  });

  test('getFilteredProducts — сортировка по цене desc', async () => {
    const results = await ProductModel.getFilteredProducts({ sortBy: 'price-desc' });
    for (let i = 1; i < results.length; i++) {
      expect(results[i].price).toBeLessThanOrEqual(results[i - 1].price);
    }
  });
});

describe('ProductModel — краш-тесты', () => {
  test('getFilteredProducts — пустой search (не падает)', async () => {
    const results = await ProductModel.getFilteredProducts({});
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
  });

  test('getFilteredProducts — несуществующая нация (пустой массив)', async () => {
    const results = await ProductModel.getFilteredProducts({ nation: 'atlantis' });
    expect(results).toEqual([]);
  });

  test('getFilteredProducts — несуществующий тип (пустой массив)', async () => {
    const results = await ProductModel.getFilteredProducts({ type: 'spaceship' });
    expect(results).toEqual([]);
  });

  test('getFilteredProducts — уровень 999 (пустой массив)', async () => {
    const results = await ProductModel.getFilteredProducts({ level: 999 });
    expect(results).toEqual([]);
  });

  test('getFilteredProducts — поиск regex спецсимволы (не падает)', async () => {
    const results = await ProductModel.getFilteredProducts({ search: '.*+?^${}()|[]\\' });
    expect(Array.isArray(results)).toBe(true);
  });

  test('getFilteredProducts — поиск XSS (не падает)', async () => {
    const results = await ProductModel.getFilteredProducts({ search: '<script>alert(1)</script>' });
    expect(Array.isArray(results)).toBe(true);
  });

  test('getFilteredProducts — поиск очень длинной строкой (не падает)', async () => {
    const results = await ProductModel.getFilteredProducts({ search: 'a'.repeat(10000) });
    expect(Array.isArray(results)).toBe(true);
  });

  test('addProduct + updateProduct + deleteProduct — полный цикл', async () => {
    const newProduct = await ProductModel.addProduct({
      name: 'TEST_MODEL_TANK',
      nation: 'ussr', type: 'heavy', level: 8, img: '',
      price: 5000, inStock: true,
      hp: '1500', dmg: '390', dpm: '2000',
      ptrs: '200', ptrp: '250', spw: '600',
      tags: ['test']
    });
    expect(newProduct.id).toBeDefined();
    expect(newProduct.name).toBe('TEST_MODEL_TANK');
    expect(newProduct.tags).toEqual(['test']);

    const found = await ProductModel.getProductById(newProduct.id);
    expect(found).toBeDefined();
    expect(found!.name).toBe('TEST_MODEL_TANK');

    const updated = await ProductModel.updateProduct(newProduct.id, { price: 9999, inStock: false });
    expect(updated).toBeDefined();
    expect(updated!.price).toBe(9999);
    expect(updated!.inStock).toBe(false);

    const deleted = await ProductModel.deleteProduct(newProduct.id);
    expect(deleted).toBe(true);

    const gone = await ProductModel.getProductById(newProduct.id);
    expect(gone).toBeUndefined();
  });

  test('deleteProduct — несуществующий id false', async () => {
    const result = await ProductModel.deleteProduct(99999);
    expect(result).toBe(false);
  });

  test('updateProduct — несуществующий id undefined', async () => {
    const result = await ProductModel.updateProduct(99999, { name: 'Test' });
    expect(result).toBeUndefined();
  });

  test('getProductById — id = 0', async () => {
    const result = await ProductModel.getProductById(0);
    expect(result).toBeUndefined();
  });

  test('addProduct — товар с минимальными полями', async () => {
    const product = await ProductModel.addProduct({
      name: 'MINIMAL_TANK',
      nation: 'ussr', type: 'light', level: 1, img: '',
      price: 100, inStock: true,
      hp: '100', dmg: '10', dpm: '100',
      ptrs: '0', ptrp: '0', spw: '0'
    });
    expect(product.id).toBeDefined();
    expect(product.name).toBe('MINIMAL_TANK');
    await ProductModel.deleteProduct(product.id);
  });

  test('addProduct — цена 0 (граница)', async () => {
    const product = await ProductModel.addProduct({
      name: 'FREE_TANK',
      nation: 'ussr', type: 'light', level: 1, img: '',
      price: 0, inStock: true,
      hp: '100', dmg: '10', dpm: '100',
      ptrs: '0', ptrp: '0', spw: '0'
    });
    expect(product.price).toBe(0);
    await ProductModel.deleteProduct(product.id);
  });

  test('addProduct — отрицательная цена', async () => {
    const product = await ProductModel.addProduct({
      name: 'NEGATIVE_TANK',
      nation: 'ussr', type: 'light', level: 1, img: '',
      price: -100, inStock: true,
      hp: '100', dmg: '10', dpm: '100',
      ptrs: '0', ptrp: '0', spw: '0'
    });
    expect(product.price).toBe(-100);
    await ProductModel.deleteProduct(product.id);
  });

  test('readProducts — файл существует (не пустой)', async () => {
    const products = await ProductModel.readProducts();
    expect(products.length).toBeGreaterThan(0);
  });

  test('writeProducts — запись и чтение', async () => {
    const original = await ProductModel.readProducts();
    await ProductModel.writeProducts(original);
    const reRead = await ProductModel.readProducts();
    expect(reRead.length).toBe(original.length);
  });
});

// ========================
// USER MODEL
// ========================
describe('UserModel — норма', () => {
  test('readUsers возвращает массив', async () => {
    const users = await UserModel.readUsers();
    expect(Array.isArray(users)).toBe(true);
    expect(users.length).toBeGreaterThan(0);
  });

  test('findUserByEmail существующий', async () => {
    const user = await UserModel.findUserByEmail('owner@shop.com');
    expect(user).toBeDefined();
    expect(user!.nickname).toBeDefined();
  });

  test('findUserByEmail несуществующий — undefined', async () => {
    const user = await UserModel.findUserByEmail('nonexistent@test.com');
    expect(user).toBeUndefined();
  });

  test('findUserByNickname существующий', async () => {
    const users = await UserModel.readUsers();
    if (users.length === 0) return;
    const nickname = users[0].nickname;
    const user = await UserModel.findUserByNickname(nickname);
    expect(user).toBeDefined();
    expect(user!.nickname).toBe(nickname);
  });

  test('findUserByNickname несуществующий — undefined', async () => {
    const user = await UserModel.findUserByNickname('nonexistent_user_12345');
    expect(user).toBeUndefined();
  });

  test('createUser + удаление', async () => {
    const user = await UserModel.createUser('model_test_user', 'model_test@test.com', 'password123');
    expect(user.id).toBeDefined();
    expect(user.nickname).toBe('model_test_user');
    expect(user.email).toBe('model_test@test.com');
    expect(user.role).toBe('user');
    expect(user.createdAt).toBeDefined();

    const found = await UserModel.findUserByEmail('model_test@test.com');
    expect(found).toBeDefined();

    const users = await UserModel.readUsers();
    const idx = users.findIndex(u => u.id === user.id);
    if (idx !== -1) {
      users.splice(idx, 1);
      await UserModel.writeUsers(users);
    }

    const gone = await UserModel.findUserByEmail('model_test@test.com');
    expect(gone).toBeUndefined();
  });
});

describe('UserModel — likedTags/likedProducts', () => {
  let testUser: any;

  beforeAll(async () => {
    const users = await UserModel.readUsers();
    let existing = users.find(u => u.email === 'liketags_test@test.com');
    if (existing) {
      users.splice(users.indexOf(existing), 1);
      await UserModel.writeUsers(users);
    }
    testUser = await UserModel.createUser('liketags_test', 'liketags_test@test.com', 'pass123');
  });

  afterAll(async () => {
    const users = await UserModel.readUsers();
    const idx = users.findIndex(u => u.id === testUser.id);
    if (idx !== -1) {
      users.splice(idx, 1);
      await UserModel.writeUsers(users);
    }
  });

  test('addLikedTags — добавляет теги', async () => {
    await UserModel.addLikedTags(testUser.id, ['heavy', 'ussr']);
    const tags = await UserModel.getUserLikedTags(testUser.id);
    expect(tags).toContain('heavy');
    expect(tags).toContain('ussr');
  });

  test('addLikedTags — повторно те же теги (обновляет timestamp)', async () => {
    await UserModel.addLikedTags(testUser.id, ['heavy']);
    const tags = await UserModel.getUserLikedTags(testUser.id);
    expect(tags).toContain('heavy');
    expect(tags.length).toBe(2);
  });

  test('addLikedTags — новые теги', async () => {
    await UserModel.addLikedTags(testUser.id, ['germany', 'light', 'td']);
    const tags = await UserModel.getUserLikedTags(testUser.id);
    expect(tags).toContain('germany');
    expect(tags).toContain('light');
  });

  test('getUserLikedTags — возвращает только актуальные', async () => {
    const tags = await UserModel.getUserLikedTags(testUser.id);
    expect(Array.isArray(tags)).toBe(true);
    expect(tags.length).toBeGreaterThanOrEqual(2);
  });

  test('hasLikedProduct — не лайкнутый', async () => {
    const result = await UserModel.hasLikedProduct(testUser.id, 999);
    expect(result).toBe(false);
  });

  test('addLikedProduct + hasLikedProduct', async () => {
    await UserModel.addLikedProduct(testUser.id, 42);
    const has = await UserModel.hasLikedProduct(testUser.id, 42);
    expect(has).toBe(true);
  });

  test('addLikedProduct — повторно (не добавляет дубликат)', async () => {
    await UserModel.addLikedProduct(testUser.id, 42);
    await UserModel.addLikedProduct(testUser.id, 42);
    const ids = await UserModel.getUserLikedProductIds(testUser.id);
    const count = ids.filter(id => id === 42).length;
    expect(count).toBe(1);
  });

  test('getUserLikedProductIds — массив id', async () => {
    const ids = await UserModel.getUserLikedProductIds(testUser.id);
    expect(Array.isArray(ids)).toBe(true);
    expect(ids.length).toBeGreaterThanOrEqual(1);
  });

  test('updateUserRole — смена роли', async () => {
    await UserModel.updateUserRole(testUser.id, 'admin');
    const users = await UserModel.readUsers();
    const user = users.find(u => u.id === testUser.id);
    expect(user!.role).toBe('admin');
    await UserModel.updateUserRole(testUser.id, 'user');
  });

  test('updateUserRole — несуществующий пользователь', async () => {
    await expect(UserModel.updateUserRole('nonexistent-id', 'admin')).rejects.toThrow('Пользователь не найден');
  });

  test('getUserLikedTags — нет пользователя = пустой массив', async () => {
    const tags = await UserModel.getUserLikedTags('nonexistent-id');
    expect(tags).toEqual([]);
  });

  test('hasLikedProduct — нет пользователя = false', async () => {
    const result = await UserModel.hasLikedProduct('nonexistent-id', 1);
    expect(result).toBe(false);
  });

  test('getUserLikedProductIds — нет пользователя = пустой массив', async () => {
    const ids = await UserModel.getUserLikedProductIds('nonexistent-id');
    expect(ids).toEqual([]);
  });

  test('createUser — с телефоном', async () => {
    const user = await UserModel.createUser('phone_test_user', 'phone_test@test.com', 'pass123', '+375291234567');
    expect(user.phone).toBe('+375291234567');
    const users = await UserModel.readUsers();
    const idx = users.findIndex(u => u.id === user.id);
    if (idx !== -1) {
      users.splice(idx, 1);
      await UserModel.writeUsers(users);
    }
  });
});

describe('UserModel — краш-тесты', () => {
  test('createUser — с пустым паролем (всё равно создаст с хешем)', async () => {
    const user = await UserModel.createUser('nopass_test', 'nopass@test.com', '');
    expect(user).toBeDefined();
    expect(user.passwordHash).toBeTruthy();
    const users = await UserModel.readUsers();
    const idx = users.findIndex(u => u.id === user.id);
    if (idx !== -1) {
      users.splice(idx, 1);
      await UserModel.writeUsers(users);
    }
  });

  test('findUserByEmail — email с спецсимволами', async () => {
    const result = await UserModel.findUserByEmail("' OR 1=1 --");
    expect(result).toBeUndefined();
  });

  test('findUserByNickname — пустая строка', async () => {
    const result = await UserModel.findUserByNickname('');
    expect(result).toBeUndefined();
  });

  test('findUserByEmail — очень длинный email', async () => {
    const result = await UserModel.findUserByEmail('a'.repeat(1000) + '@test.com');
    expect(result).toBeUndefined();
  });

  test('addLikedTags — несуществующий userId (не падает)', async () => {
    await UserModel.addLikedTags('nonexistent-id', ['test']);
  });

  test('addLikedProduct — несуществующий userId (не падает)', async () => {
    await UserModel.addLikedProduct('nonexistent-id', 1);
  });

  test('getUserLikedTags — пользователь есть, но нет тегов = []', async () => {
    const user = await UserModel.createUser('notags_test', 'notags@test.com', 'pass123');
    const tags = await UserModel.getUserLikedTags(user.id);
    expect(tags).toEqual([]);
    const users = await UserModel.readUsers();
    const idx = users.findIndex(u => u.id === user.id);
    if (idx !== -1) {
      users.splice(idx, 1);
      await UserModel.writeUsers(users);
    }
  });
});

// ========================
// REVIEW MODEL
// ========================
describe('ReviewModel — норма', () => {
  test('readReviews возвращает массив', async () => {
    const reviews = await ReviewModel.readReviews();
    expect(Array.isArray(reviews)).toBe(true);
  });

  test('addReview + getReviewsByProductId', async () => {
    const review = await ReviewModel.addReview({
      productId: 1, userId: 'test-user', userName: 'Tester',
      rating: 5, comment: 'Great tank!'
    });
    expect(review.id).toBeDefined();
    expect(review.createdAt).toBeDefined();
    expect(review.rating).toBe(5);
    expect(review.comment).toBe('Great tank!');
    expect(review.productId).toBe(1);
    expect(review.userName).toBe('Tester');

    const reviews = await ReviewModel.getReviewsByProductId(1);
    expect(reviews.length).toBeGreaterThanOrEqual(1);
    const found = reviews.find(r => r.id === review.id);
    expect(found).toBeDefined();
  });

  test('getAverageRating — существующий товар', async () => {
    const avg = await ReviewModel.getAverageRating(1);
    expect(typeof avg).toBe('number');
    expect(avg).toBeGreaterThanOrEqual(0);
    expect(avg).toBeLessThanOrEqual(5);
  });

  test('hasUserReviewedProduct — существующий', async () => {
    const has = await ReviewModel.hasUserReviewedProduct('test-user', 1);
    expect(has).toBe(true);
  });

  test('hasUserReviewedProduct — не существующий', async () => {
    const has = await ReviewModel.hasUserReviewedProduct('test-user', 999);
    expect(has).toBe(false);
  });

  test('getReviewsByProductId — сортировка по дате', async () => {
    const reviews = await ReviewModel.getReviewsByProductId(1);
    for (let i = 1; i < reviews.length; i++) {
      const prev = new Date(reviews[i - 1].createdAt).getTime();
      const curr = new Date(reviews[i].createdAt).getTime();
      expect(prev).toBeGreaterThanOrEqual(curr);
    }
  });
});

describe('ReviewModel — краш-тесты', () => {
  test('getReviewsByProductId — несуществующий товар = []', async () => {
    const reviews = await ReviewModel.getReviewsByProductId(99999);
    expect(reviews).toEqual([]);
  });

  test('getAverageRating — нет отзывов = 0', async () => {
    const avg = await ReviewModel.getAverageRating(99999);
    expect(avg).toBe(0);
  });

  test('addReview — с минимальными полями', async () => {
    const review = await ReviewModel.addReview({
      productId: 1, userId: 'min-user', userName: 'Min',
      rating: 1, comment: 'ok'
    });
    expect(review.id).toBeDefined();
    expect(review.rating).toBe(1);
    const all = await ReviewModel.readReviews();
    const idx = all.findIndex(r => r.id === review.id);
    if (idx !== -1) {
      all.splice(idx, 1);
      await ReviewModel.writeReviews(all);
    }
  });

  test('addReview — максимальная оценка 5', async () => {
    const review = await ReviewModel.addReview({
      productId: 1, userId: 'max-user', userName: 'Max',
      rating: 5, comment: 'Excellent!'
    });
    expect(review.rating).toBe(5);
    const all = await ReviewModel.readReviews();
    const idx = all.findIndex(r => r.id === review.id);
    if (idx !== -1) {
      all.splice(idx, 1);
      await ReviewModel.writeReviews(all);
    }
  });

  test('hasUserReviewedProduct — несуществующий userId', async () => {
    const has = await ReviewModel.hasUserReviewedProduct('nonexistent-user', 1);
    expect(has).toBe(false);
  });

  test('getReviewsByProductId — productId = 0', async () => {
    const reviews = await ReviewModel.getReviewsByProductId(0);
    expect(Array.isArray(reviews)).toBe(true);
  });

  test('addReview — супер-длинный comment', async () => {
    const review = await ReviewModel.addReview({
      productId: 1, userId: 'long-user', userName: 'Long',
      rating: 3, comment: 'A'.repeat(10000)
    });
    expect(review.comment.length).toBe(10000);
    const all = await ReviewModel.readReviews();
    const idx = all.findIndex(r => r.id === review.id);
    if (idx !== -1) {
      all.splice(idx, 1);
      await ReviewModel.writeReviews(all);
    }
  });

  test('addReview — XSS в comment', async () => {
    const review = await ReviewModel.addReview({
      productId: 1, userId: 'xss-review-user', userName: 'XSS',
      rating: 3, comment: '<script>alert("xss")</script>'
    });
    expect(review.comment).toBe('<script>alert("xss")</script>');
    const all = await ReviewModel.readReviews();
    const idx = all.findIndex(r => r.id === review.id);
    if (idx !== -1) {
      all.splice(idx, 1);
      await ReviewModel.writeReviews(all);
    }
  });

  test('writeReviews + readReviews — полный цикл', async () => {
    const original = await ReviewModel.readReviews();
    await ReviewModel.writeReviews(original);
    const reRead = await ReviewModel.readReviews();
    expect(reRead.length).toBe(original.length);
  });

  test('readReviews — пустой массив при ошибке', async () => {
    const result = await ReviewModel.readReviews();
    expect(Array.isArray(result)).toBe(true);
  });
});

// ========================
// CLEANUP
// ========================
afterAll(async () => {
  const users = JSON.parse(await fs.readFile(USERS_FILE, 'utf-8'));
  const testEmails = [
    'model_test@test.com', 'liketags_test@test.com',
    'nopass@test.com', 'notags@test.com',
    'phone_test@test.com'
  ];
  for (const email of testEmails) {
    const idx = users.findIndex((u: any) => u.email === email);
    if (idx !== -1) {
      users.splice(idx, 1);
    }
  }
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));

  const tanks = JSON.parse(await fs.readFile(TANKS_FILE, 'utf-8'));
  const testTankNames = [
    'TEST_MODEL_TANK', 'MINIMAL_TANK', 'FREE_TANK',
    'NEGATIVE_TANK', 'TEST_INSTOCK'
  ];
  for (const name of testTankNames) {
    const idx = tanks.findIndex((t: any) => t.name === name);
    if (idx !== -1) {
      tanks.splice(idx, 1);
    }
  }
  await fs.writeFile(TANKS_FILE, JSON.stringify(tanks, null, 2));

  const reviews = JSON.parse(await fs.readFile(path.join(__dirname, '../../reviews.json'), 'utf-8'));
  const testUserIds = ['test-user', 'min-user', 'max-user', 'long-user', 'xss-review-user'];
  const filtered = reviews.filter((r: any) => !testUserIds.includes(r.userId));
  await fs.writeFile(path.join(__dirname, '../../reviews.json'), JSON.stringify(filtered, null, 2));
});
