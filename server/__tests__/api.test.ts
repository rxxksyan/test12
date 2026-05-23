/// <reference types="jest" />
import request from 'supertest';
import app from '../app';
import fs from 'fs/promises';
import path from 'path';

const USERS_FILE = path.join(__dirname, '../../users.json');
const TANKS_FILE = path.join(__dirname, '../../tanks.json');

let testUserId = '';
let productId = 0;
let cookie = '';
let ownerCookie = '';

async function loginAs(email: string, password: string): Promise<string> {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password });
  if (res.status !== 200) return '';
  const cookies = res.headers['set-cookie'];
  return Array.isArray(cookies) ? cookies.join(';') : cookies;
}

function getSessionCookie(cookies: any): string {
  if (!cookies) return '';
  return Array.isArray(cookies) ? cookies.join(';') : cookies;
}

beforeAll(async () => {
  const users = JSON.parse(await fs.readFile(USERS_FILE, 'utf-8'));
  const toRemove = users.filter((u: any) =>
    u.email === 'test_delete_me@test.com' ||
    u.email === 'crash_test@test.com' ||
    u.email === 'xss_test@test.com'
  );
  for (const u of toRemove) {
    users.splice(users.indexOf(u), 1);
  }
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));

  const tanks = JSON.parse(await fs.readFile(TANKS_FILE, 'utf-8'));
  const testTank = tanks.find((t: any) => t.name === 'TEST_TANK_DELETE_ME');
  if (testTank) {
    tanks.splice(tanks.indexOf(testTank), 1);
    await fs.writeFile(TANKS_FILE, JSON.stringify(tanks, null, 2));
  }
});

// ========================
// LOCALIZATION API
// ========================
describe('Localization API — нормальное поведение', () => {
  test('GET /api/locale — без локали возвращает null', async () => {
    const res = await request(app).get('/api/locale');
    expect(res.status).toBe(200);
    expect(res.body.lang).toBeNull();
  });

  test('POST /api/locale — установка ru', async () => {
    const res = await request(app).post('/api/locale').send({ lang: 'ru' });
    expect(res.status).toBe(200);
    expect(res.body.lang).toBe('ru');
  });

  test('POST /api/locale — установка en', async () => {
    const res = await request(app).post('/api/locale').send({ lang: 'en' });
    expect(res.status).toBe(200);
    expect(res.body.lang).toBe('en');
  });

  test('GET /api/locale/:lang — загрузка файла локали', async () => {
    const res = await request(app).get('/api/locale/ru');
    expect(res.status).toBe(200);
    expect(res.body.lang).toBe('ru');
    expect(res.body.locale).toBeDefined();
    expect(res.body.locale['nav.home']).toBeDefined();
  });

  test('GET /api/locale/:lang — en тоже работает', async () => {
    const res = await request(app).get('/api/locale/en');
    expect(res.status).toBe(200);
    expect(res.body.lang).toBe('en');
    expect(res.body.locale['nav.home']).toBeDefined();
  });
});

describe('Localization API — краш-тесты', () => {
  test('POST /api/locale — невалидный язык 400', async () => {
    const res = await request(app).post('/api/locale').send({ lang: 'fr' });
    expect(res.status).toBe(400);
  });

  test('POST /api/locale — пустой язык 400', async () => {
    const res = await request(app).post('/api/locale').send({ lang: '' });
    expect(res.status).toBe(400);
  });

  test('POST /api/locale — нет поля lang 400', async () => {
    const res = await request(app).post('/api/locale').send({});
    expect(res.status).toBe(400);
  });

  test('POST /api/locale — XSS попытка в lang', async () => {
    const res = await request(app).post('/api/locale').send({ lang: '<script>alert(1)</script>' });
    expect(res.status).toBe(400);
  });

  test('GET /api/locale/:lang — невалидный lang 400', async () => {
    const res = await request(app).get('/api/locale/fr');
    expect(res.status).toBe(400);
  });

  test('GET /api/locale/:lang — SQL-инъекция 400', async () => {
    const res = await request(app).get("/api/locale/'; DROP TABLE users;--");
    expect(res.status).toBe(400);
  });

  test('POST /api/locale — установка потом проверка (кука не переносится между запросами)', async () => {
    const postRes = await request(app).post('/api/locale').send({ lang: 'ru' });
    expect(postRes.status).toBe(200);
    const getRes = await request(app).get('/api/locale');
    expect(getRes.status).toBe(200);
  });

  test('POST /api/locale — числа вместо строки 400', async () => {
    const res = await request(app).post('/api/locale').send({ lang: 123 });
    expect(res.status).toBe(400);
  });
});

// ========================
// AUTH API
// ========================
describe('Auth API — регистрация и вход', () => {
  const testUser = {
    nickname: 'test_delete_me',
    email: 'test_delete_me@test.com',
    password: 'test123456'
  };

  beforeAll(async () => {
    const users = JSON.parse(await fs.readFile(USERS_FILE, 'utf-8'));
    const existing = users.find((u: any) => u.email === testUser.email);
    if (existing) {
      users.splice(users.indexOf(existing), 1);
      await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
    }
  });

  test('POST /api/auth/register — создание пользователя', async () => {
    const res = await request(app).post('/api/auth/register').send(testUser);
    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe(testUser.email);
    expect(res.body.user.role).toBe('user');
    expect(res.body.user.id).toBeDefined();
    testUserId = res.body.user.id;
    cookie = getSessionCookie(res.headers['set-cookie']);
    expect(cookie).toBeTruthy();
  });

  test('POST /api/auth/register — дубликат email 400', async () => {
    const res = await request(app).post('/api/auth/register').send(testUser);
    expect(res.status).toBe(400);
  });

  test('POST /api/auth/register — пустые поля 400', async () => {
    const res = await request(app).post('/api/auth/register').send({ nickname: 'x', email: 'x@x.com' });
    expect(res.status).toBe(400);
  });

  test('POST /api/auth/logout — выход', async () => {
    const res = await request(app).post('/api/auth/logout').set('Cookie', cookie);
    expect(res.status).toBe(200);
  });

  test('POST /api/auth/login — вход', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: testUser.email, password: testUser.password });
    expect(res.status).toBe(200);
    expect(res.body.user.role).toBeDefined();
    cookie = getSessionCookie(res.headers['set-cookie']);
  });

  test('GET /api/auth/me — текущий пользователь', async () => {
    const res = await request(app).get('/api/auth/me').set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(testUser.email);
    expect(res.body.user.role).toBe('user');
  });

  test('GET /api/auth/me — без куки 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  test('POST /api/auth/login — с супер-длинным паролем', async () => {
    const longPass = 'a'.repeat(1000);
    await request(app).post('/api/auth/register').send({
      nickname: 'crash_test_longpass',
      email: 'crash_test@test.com',
      password: longPass
    });
    const res = await request(app).post('/api/auth/login').send({ email: 'crash_test@test.com', password: longPass });
    expect(res.status).toBe(200);
    const users = JSON.parse(await fs.readFile(USERS_FILE, 'utf-8'));
    const idx = users.findIndex((u: any) => u.email === 'crash_test@test.com');
    if (idx !== -1) {
      users.splice(idx, 1);
      await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
    }
  });
});

describe('Auth API — краш-тесты', () => {
  test('POST /api/auth/login — неверный пароль 401', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'test_delete_me@test.com', password: 'wrongpass' });
    expect(res.status).toBe(401);
  });

  test('POST /api/auth/login — несуществующий email 401', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'nonexistent@test.com', password: 'pass123' });
    expect(res.status).toBe(401);
  });

  test('POST /api/auth/login — SQL-инъекция в email 401', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: "' OR 1=1 --", password: 'test' });
    expect(res.status).toBe(401);
  });

  test('POST /api/auth/login — XSS попытка', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: '<script>alert(1)</script>', password: 'test' });
    expect(res.status).toBe(401);
  });

  test('POST /api/auth/login — пустой пароль 400', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'test_delete_me@test.com' });
    expect(res.status).toBe(400);
  });

  test('POST /api/auth/login — пустой email 400', async () => {
    const res = await request(app).post('/api/auth/login').send({ password: 'test123' });
    expect(res.status).toBe(400);
  });

  test('POST /api/auth/login — пустое тело 400', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
  });

  test('POST /api/auth/logout — двойной выход', async () => {
    await request(app).post('/api/auth/logout').set('Cookie', cookie);
    const res = await request(app).post('/api/auth/logout').set('Cookie', cookie);
    expect(res.status).toBe(200);
    const loginRes = await request(app).post('/api/auth/login').send({ email: 'test_delete_me@test.com', password: 'test123456' });
    cookie = getSessionCookie(loginRes.headers['set-cookie']);
  });

  test('POST /api/auth/register — XSS в nickname', async () => {
    const res = await request(app).post('/api/auth/register').send({
      nickname: '<img src=x onerror=alert(1)>',
      email: 'xss_test@test.com',
      password: 'test123456'
    });
    expect(res.status).toBe(201);
    const users = JSON.parse(await fs.readFile(USERS_FILE, 'utf-8'));
    const idx = users.findIndex((u: any) => u.email === 'xss_test@test.com');
    if (idx !== -1) {
      users.splice(idx, 1);
      await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
    }
  });

  test('POST /api/auth/register — супер-длинный nickname', async () => {
    const res = await request(app).post('/api/auth/register').send({
      nickname: 'a'.repeat(10000),
      email: 'longnick@test.com',
      password: 'test123456'
    });
    expect([201, 400, 500]).toContain(res.status);
    if (res.status === 201) {
      const users = JSON.parse(await fs.readFile(USERS_FILE, 'utf-8'));
      const idx = users.findIndex((u: any) => u.email === 'longnick@test.com');
      if (idx !== -1) {
        users.splice(idx, 1);
        await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
      }
    }
  });
});

// ========================
// PASSWORD CHANGE
// ========================
describe('Auth — смена пароля', () => {
  test('POST /api/auth/change-password — смена + релогин', async () => {
    const res = await request(app)
      .post('/api/auth/change-password').set('Cookie', cookie)
      .send({ oldPassword: 'test123456', newPassword: 'newpass123456' });
    expect(res.status).toBe(200);

    const loginRes = await request(app).post('/api/auth/login').send({ email: 'test_delete_me@test.com', password: 'newpass123456' });
    expect(loginRes.status).toBe(200);
    cookie = getSessionCookie(loginRes.headers['set-cookie']);

    const restoreRes = await request(app)
      .post('/api/auth/change-password').set('Cookie', cookie)
      .send({ oldPassword: 'newpass123456', newPassword: 'test123456' });
    expect(restoreRes.status).toBe(200);

    const reloginRes = await request(app).post('/api/auth/login').send({ email: 'test_delete_me@test.com', password: 'test123456' });
    expect(reloginRes.status).toBe(200);
    cookie = getSessionCookie(reloginRes.headers['set-cookie']);
  });

  test('POST /api/auth/change-password — неверный старый пароль 400', async () => {
    const res = await request(app)
      .post('/api/auth/change-password').set('Cookie', cookie)
      .send({ oldPassword: 'wrongold', newPassword: 'newpass123456' });
    expect(res.status).toBe(400);
  });

  test('POST /api/auth/change-password — короткий пароль 400', async () => {
    const res = await request(app)
      .post('/api/auth/change-password').set('Cookie', cookie)
      .send({ oldPassword: 'test123456', newPassword: 'abc' });
    expect(res.status).toBe(400);
  });

  test('POST /api/auth/change-password — пустые поля 400', async () => {
    const res = await request(app)
      .post('/api/auth/change-password').set('Cookie', cookie)
      .send({});
    expect(res.status).toBe(400);
  });

  test('POST /api/auth/change-password — без авторизации 401', async () => {
    const res = await request(app)
      .post('/api/auth/change-password').send({ oldPassword: 'x', newPassword: 'y' });
    expect(res.status).toBe(401);
  });
});

// ========================
// CATALOG API
// ========================
describe('Catalog API — получение товаров', () => {
  test('GET /api/catalog — список товаров', async () => {
    const res = await request(app).get('/api/catalog');
    expect(res.status).toBe(200);
    expect(res.body.products.length).toBeGreaterThan(0);
    productId = res.body.products[0].id;
  });

  test('GET /api/catalog — фильтр по нации', async () => {
    const res = await request(app).get('/api/catalog?nation=ussr');
    expect(res.status).toBe(200);
    res.body.products.forEach((p: any) => expect(p.nation).toBe('ussr'));
  });

  test('GET /api/catalog — фильтр по типу', async () => {
    const res = await request(app).get('/api/catalog?type=heavy');
    expect(res.status).toBe(200);
    res.body.products.forEach((p: any) => expect(p.type).toBe('heavy'));
  });

  test('GET /api/catalog — фильтр по наличию', async () => {
    const res = await request(app).get('/api/catalog?inStock=true');
    expect(res.status).toBe(200);
    res.body.products.forEach((p: any) => expect(p.inStock).toBe(true));
  });

  test('GET /api/catalog — сортировка по цене asc', async () => {
    const res = await request(app).get('/api/catalog?sortBy=price-asc');
    expect(res.status).toBe(200);
    for (let i = 1; i < res.body.products.length; i++)
      expect(res.body.products[i].price).toBeGreaterThanOrEqual(res.body.products[i - 1].price);
  });

  test('GET /api/catalog — сортировка по цене desc', async () => {
    const res = await request(app).get('/api/catalog?sortBy=price-desc');
    expect(res.status).toBe(200);
    for (let i = 1; i < res.body.products.length; i++)
      expect(res.body.products[i].price).toBeLessThanOrEqual(res.body.products[i - 1].price);
  });

  test('GET /api/catalog/:id — конкретный товар', async () => {
    const res = await request(app).get(`/api/catalog/${productId}`);
    expect(res.status).toBe(200);
    expect(res.body.product.id).toBe(productId);
  });

  test('GET /api/catalog/filters — фильтры', async () => {
    const res = await request(app).get('/api/catalog/filters');
    expect(res.status).toBe(200);
    expect(res.body.filters.nations.length).toBeGreaterThan(0);
    expect(res.body.filters.types.length).toBeGreaterThan(0);
    expect(res.body.filters.levels.length).toBeGreaterThan(0);
  });

  test('GET /api/catalog/search — поиск (статус 200)', async () => {
    const res = await request(app).get('/api/catalog/search?q=140');
    expect(res.status).toBe(200);
  });
});

describe('Catalog API — краш-тесты', () => {
  test('GET /api/catalog/:id — несуществующий id 404', async () => {
    const res = await request(app).get('/api/catalog/99999');
    expect(res.status).toBe(404);
  });

  test('GET /api/catalog/:id — NaN id 400', async () => {
    const res = await request(app).get('/api/catalog/abc');
    expect(res.status).toBe(400);
  });

  test('GET /api/catalog/:id — отрицательный id (id < 1 → 400)', async () => {
    const res = await request(app).get('/api/catalog/-1');
    expect(res.status).toBe(400);
  });

  test('GET /api/catalog/:id — дробный id', async () => {
    const res = await request(app).get('/api/catalog/1.5');
    expect([200, 404]).toContain(res.status);
  });

  test('GET /api/catalog/search — без query 400', async () => {
    const res = await request(app).get('/api/catalog/search');
    expect(res.status).toBe(400);
  });

  test('GET /api/catalog/search — пустой query (сервер отдаёт 400)', async () => {
    const res = await request(app).get('/api/catalog/search?q=');
    expect(res.status).toBe(400);
  });

  test('GET /api/catalog/search — XSS в поиске', async () => {
    const res = await request(app).get('/api/catalog/search?q=<script>alert(1)</script>');
    expect(res.status).toBe(200);
  });

  test('GET /api/catalog/search — regex special chars', async () => {
    const res = await request(app).get('/api/catalog/search?q=.*+?^${}()|[]\\');
    expect(res.status).toBe(200);
  });

  test('GET /api/catalog — невалидный sortBy (просто игнорируется)', async () => {
    const res = await request(app).get('/api/catalog?sortBy=invalid');
    expect(res.status).toBe(200);
    expect(res.body.products.length).toBeGreaterThan(0);
  });

  test('GET /api/catalog — комбинированные фильтры (nation + type + inStock)', async () => {
    const res = await request(app).get('/api/catalog?nation=ussr&type=heavy&inStock=true');
    expect(res.status).toBe(200);
    res.body.products.forEach((p: any) => {
      expect(p.nation).toBe('ussr');
      expect(p.type).toBe('heavy');
      expect(p.inStock).toBe(true);
    });
  });
});

// ========================
// LIKES & RECOMMENDATIONS
// ========================
describe('Like & Recommendation API — норма', () => {
  beforeAll(async () => {
    cookie = await loginAs('test_delete_me@test.com', 'test123456');
    expect(cookie).toBeTruthy();
  });

  test('POST /api/catalog/:id/like — без авторизации 401', async () => {
    const res = await request(app).post(`/api/catalog/1/like`);
    expect(res.status).toBe(401);
  });

  test('POST /api/catalog/:id/like — лайк товара', async () => {
    const res = await request(app).post(`/api/catalog/${productId}/like`).set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(res.body.likesCount).toBeDefined();
  });

  test('POST /api/catalog/:id/like — повторный лайк 409', async () => {
    const res = await request(app).post(`/api/catalog/${productId}/like`).set('Cookie', cookie);
    expect(res.status).toBe(409);
  });

  test('POST /api/catalog/:id/like — несуществующий товар 404', async () => {
    const res = await request(app).post('/api/catalog/99999/like').set('Cookie', cookie);
    expect(res.status).toBe(404);
  });

  test('GET /api/catalog/recommended — после лайка', async () => {
    const res = await request(app).get('/api/catalog/recommended').set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.products)).toBe(true);
  });

  test('GET /api/catalog/recommended — без авторизации пусто', async () => {
    const res = await request(app).get('/api/catalog/recommended');
    expect(res.status).toBe(200);
    expect(res.body.products).toEqual([]);
  });
});

describe('Like & Recommendation — краш-тесты', () => {
  test('POST /api/catalog/:id/like — NaN id 400', async () => {
    const res = await request(app).post('/api/catalog/abc/like').set('Cookie', cookie);
    expect(res.status).toBe(400);
  });

  test('POST /api/catalog/:id/like — отрицательный id 400', async () => {
    const res = await request(app).post('/api/catalog/-1/like').set('Cookie', cookie);
    expect(res.status).toBe(400);
  });

  test('POST /api/catalog/:id/like — дробный id (200/400/404)', async () => {
    const res = await request(app).post('/api/catalog/1.5/like').set('Cookie', cookie);
    expect([200, 400, 404, 409]).toContain(res.status);
  });
});

// ========================
// REVIEWS
// ========================
describe('Review API', () => {
  beforeAll(async () => {
    cookie = await loginAs('test_delete_me@test.com', 'test123456');
    expect(cookie).toBeTruthy();
  });

  test('GET /api/catalog/:id/reviews — отзывы товара', async () => {
    const res = await request(app).get(`/api/catalog/${productId}/reviews`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.reviews)).toBe(true);
    expect(res.body.averageRating).toBeDefined();
  });

  test('POST /api/catalog/:id/reviews — без авторизации 401', async () => {
    const res = await request(app).post(`/api/catalog/${productId}/reviews`).send({ rating: 5, comment: 'Great!' });
    expect(res.status).toBe(401);
  });

  test('POST /api/catalog/:id/reviews — создание отзыва', async () => {
    const res = await request(app).post(`/api/catalog/${productId}/reviews`).set('Cookie', cookie).send({ rating: 5, comment: 'Test review comment' });
    expect(res.status).toBe(201);
    expect(res.body.review).toBeDefined();
    expect(res.body.review.userName).toBeDefined();
    expect(res.body.review.createdAt).toBeDefined();
  });

  test('POST /api/catalog/:id/reviews — дубликат 409', async () => {
    const res = await request(app).post(`/api/catalog/${productId}/reviews`).set('Cookie', cookie).send({ rating: 4, comment: 'Another review' });
    expect(res.status).toBe(409);
  });

  test('POST /api/catalog/:id/reviews — без comment 400', async () => {
    const res = await request(app).post(`/api/catalog/${productId}/reviews`).set('Cookie', cookie).send({ rating: 5 });
    expect(res.status).toBe(400);
  });

  test('POST /api/catalog/:id/reviews — невалидный rating 400', async () => {
    const res = await request(app).post(`/api/catalog/${productId}/reviews`).set('Cookie', cookie).send({ rating: 999, comment: 'Bad' });
    expect(res.status).toBe(400);
  });
});

describe('Review API — краш-тесты', () => {
  test('POST /api/catalog/:id/reviews — rating = 0 (нижняя граница) 400', async () => {
    const res = await request(app).post(`/api/catalog/${productId}/reviews`).set('Cookie', cookie).send({ rating: 0, comment: 'Zero rating' });
    expect(res.status).toBe(400);
  });

  test('POST /api/catalog/:id/reviews — rating = 6 (верхняя граница) 400', async () => {
    const res = await request(app).post(`/api/catalog/${productId}/reviews`).set('Cookie', cookie).send({ rating: 6, comment: 'Too high' });
    expect(res.status).toBe(400);
  });

  test('POST /api/catalog/:id/reviews — rating = -1 400', async () => {
    const res = await request(app).post(`/api/catalog/${productId}/reviews`).set('Cookie', cookie).send({ rating: -1, comment: 'Negative' });
    expect(res.status).toBe(400);
  });

  test('POST /api/catalog/:id/reviews — XSS в comment', async () => {
    const otherUser = await request(app).post('/api/auth/register').send({
      nickname: 'review_xss_test',
      email: 'review_xss@test.com',
      password: 'test123'
    });
    const otherCookie = getSessionCookie(otherUser.headers['set-cookie']);

    const allProducts = await request(app).get('/api/catalog');
    const target = allProducts.body.products.find((p: any) => p.id !== productId) || allProducts.body.products[0];

    const res = await request(app).post(`/api/catalog/${target.id}/reviews`).set('Cookie', otherCookie)
      .send({ rating: 3, comment: '<script>alert("xss")</script>' });
    expect([201, 400]).toContain(res.status);

    const users = JSON.parse(await fs.readFile(USERS_FILE, 'utf-8'));
    const idx = users.findIndex((u: any) => u.email === 'review_xss@test.com');
    if (idx !== -1) {
      users.splice(idx, 1);
      await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
    }
  });

  test('POST /api/catalog/:id/reviews — супер-длинный comment', async () => {
    const res = await request(app).post(`/api/catalog/${productId}/reviews`).set('Cookie', cookie)
      .send({ rating: 3, comment: 'A'.repeat(10000) });
    expect([201, 400]).toContain(res.status);
  });

  test('POST /api/catalog/:id/reviews — comment из пробелов 400', async () => {
    const res = await request(app).post(`/api/catalog/${productId}/reviews`).set('Cookie', cookie)
      .send({ rating: 3, comment: '   ' });
    expect(res.status).toBe(400);
  });

  test('GET /api/catalog/:id/reviews — невалидный id 400', async () => {
    const res = await request(app).get('/api/catalog/abc/reviews');
    expect(res.status).toBe(400);
  });

  test('GET /api/catalog/:id/reviews — несуществующий id (пустой массив)', async () => {
    const res = await request(app).get('/api/catalog/99999/reviews');
    expect(res.status).toBe(200);
    expect(res.body.reviews).toEqual([]);
    expect(res.body.averageRating).toBe(0);
  });
});

// ========================
// CART API
// ========================
describe('Cart API', () => {
  beforeAll(async () => {
    cookie = await loginAs('test_delete_me@test.com', 'test123456');
    expect(cookie).toBeTruthy();
  });

  test('GET /api/cart — без авторизации 401', async () => {
    const res = await request(app).get('/api/cart');
    expect(res.status).toBe(401);
  });

  test('GET /api/cart — корзина', async () => {
    const res = await request(app).get('/api/cart').set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(res.body.cart).toBeDefined();
  });

  test('GET /api/cart/count — количество', async () => {
    const res = await request(app).get('/api/cart/count').set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(typeof res.body.count).toBe('number');
  });

  test('POST /api/cart — добавление товара', async () => {
    const res = await request(app).post('/api/cart').set('Cookie', cookie).send({ productId, quantity: 1 });
    expect(res.status).toBe(200);
    expect(res.body.cart).toBeDefined();
    expect(res.body.total).toBeDefined();
  });

  test('POST /api/cart — нет productId 400', async () => {
    const res = await request(app).post('/api/cart').set('Cookie', cookie).send({});
    expect(res.status).toBe(400);
  });

  test('PUT /api/cart — обновление количества', async () => {
    const res = await request(app).put('/api/cart').set('Cookie', cookie).send({ productId, quantity: 3 });
    expect(res.status).toBe(200);
  });

  test('PUT /api/cart — нет полей 400', async () => {
    const res = await request(app).put('/api/cart').set('Cookie', cookie).send({ productId });
    expect(res.status).toBe(400);
  });

  test('DELETE /api/cart/:productId — удаление товара', async () => {
    const res = await request(app).delete(`/api/cart/${productId}`).set('Cookie', cookie);
    expect(res.status).toBe(200);
  });

  test('DELETE /api/cart/:productId — невалидный id 400', async () => {
    const res = await request(app).delete('/api/cart/abc').set('Cookie', cookie);
    expect(res.status).toBe(400);
  });

  test('DELETE /api/cart — очистка корзины', async () => {
    await request(app).post('/api/cart').set('Cookie', cookie).send({ productId, quantity: 1 });
    const res = await request(app).delete('/api/cart').set('Cookie', cookie);
    expect(res.status).toBe(200);
  });

  test('POST /api/cart — без авторизации 401', async () => {
    const res = await request(app).post('/api/cart').send({ productId: 1, quantity: 1 });
    expect(res.status).toBe(401);
  });
});

describe('Cart API — краш-тесты', () => {
  beforeAll(async () => {
    cookie = await loginAs('test_delete_me@test.com', 'test123456');
    expect(cookie).toBeTruthy();
  });

  test('POST /api/cart — quantity = 0', async () => {
    const res = await request(app).post('/api/cart').set('Cookie', cookie).send({ productId, quantity: 0 });
    expect(res.status).toBe(200);
  });

  test('POST /api/cart — quantity = -1', async () => {
    const res = await request(app).post('/api/cart').set('Cookie', cookie).send({ productId, quantity: -1 });
    expect([200, 400]).toContain(res.status);
  });

  test('POST /api/cart — quantity = очень много', async () => {
    const res = await request(app).post('/api/cart').set('Cookie', cookie).send({ productId, quantity: 999999 });
    expect(res.status).toBe(200);
  });

  test('POST /api/cart — несуществующий productId', async () => {
    const res = await request(app).post('/api/cart').set('Cookie', cookie).send({ productId: 99999, quantity: 1 });
    expect([200, 400, 404]).toContain(res.status);
  });

  test('PUT /api/cart — quantity = 0 (удаление)', async () => {
    await request(app).post('/api/cart').set('Cookie', cookie).send({ productId, quantity: 1 });
    const res = await request(app).put('/api/cart').set('Cookie', cookie).send({ productId, quantity: 0 });
    expect(res.status).toBe(200);
  });

  test('PUT /api/cart — quantity = -1', async () => {
    await request(app).post('/api/cart').set('Cookie', cookie).send({ productId, quantity: 1 });
    const res = await request(app).put('/api/cart').set('Cookie', cookie).send({ productId, quantity: -5 });
    expect([200, 400]).toContain(res.status);
  });

  test('DELETE /api/cart/:productId — не в корзине', async () => {
    const res = await request(app).delete('/api/cart/99999').set('Cookie', cookie);
    expect([200, 404]).toContain(res.status);
  });

  test('DELETE /api/cart — очистка пустой корзины', async () => {
    await request(app).delete('/api/cart').set('Cookie', cookie);
    const res = await request(app).delete('/api/cart').set('Cookie', cookie);
    expect(res.status).toBe(200);
  });

  test('POST /api/cart — productId = NaN', async () => {
    const res = await request(app).post('/api/cart').set('Cookie', cookie).send({ productId: 'abc', quantity: 1 });
    expect([200, 400, 404]).toContain(res.status);
  });
});

// ========================
// DELIVERY API
// ========================
describe('Delivery API', () => {
  beforeAll(async () => {
    cookie = await loginAs('test_delete_me@test.com', 'test123456');
    expect(cookie).toBeTruthy();
    await request(app).post('/api/cart').set('Cookie', cookie).send({ productId, quantity: 1 });
  });

  test('GET /api/delivery — без авторизации 401', async () => {
    const res = await request(app).get('/api/delivery');
    expect(res.status).toBe(401);
  });

  test('GET /api/delivery — список доставок', async () => {
    const res = await request(app).get('/api/delivery').set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.deliveries)).toBe(true);
  });

  test('POST /api/delivery — нет полей 400', async () => {
    const res = await request(app).post('/api/delivery').set('Cookie', cookie).send({ address: 'Test' });
    expect(res.status).toBe(400);
  });

  test('POST /api/delivery — невалидный payment 400', async () => {
    const res = await request(app).post('/api/delivery').set('Cookie', cookie).send({
      address: 'Test Address', phone: '+375291234567', email: 'test@test.com', paymentMethod: 'bitcoin'
    });
    expect(res.status).toBe(400);
  });

  test('POST /api/delivery — создание доставки', async () => {
    const res = await request(app).post('/api/delivery').set('Cookie', cookie).send({
      address: 'Test Address', phone: '+375291234567', email: 'test@test.com', paymentMethod: 'card'
    });
    expect(res.status).toBe(201);
    expect(res.body.delivery.status).toBe('pending');
  });

  test('GET /api/delivery/:id — конкретная доставка', async () => {
    const deliveries = await request(app).get('/api/delivery').set('Cookie', cookie);
    const deliveryId = deliveries.body.deliveries[0]?.id;
    if (!deliveryId) return;
    const res = await request(app).get(`/api/delivery/${deliveryId}`).set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(res.body.delivery.id).toBe(deliveryId);
  });

  test('GET /api/delivery/:id — несуществующая 404', async () => {
    const res = await request(app).get('/api/delivery/nonexistent-id').set('Cookie', cookie);
    expect(res.status).toBe(404);
  });

  test('DELETE /api/delivery/:id — отмена доставки', async () => {
    const deliveries = await request(app).get('/api/delivery').set('Cookie', cookie);
    const deliveryId = deliveries.body.deliveries[0]?.id;
    if (!deliveryId) return;
    const res = await request(app).delete(`/api/delivery/${deliveryId}`).set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(res.body.delivery.status).toBe('cancelled');
  });
});

describe('Delivery API — краш-тесты', () => {
  beforeAll(async () => {
    cookie = await loginAs('test_delete_me@test.com', 'test123456');
    expect(cookie).toBeTruthy();
    await request(app).post('/api/cart').set('Cookie', cookie).send({ productId, quantity: 1 });
  });

  test('POST /api/delivery — пустой адрес 400', async () => {
    const res = await request(app).post('/api/delivery').set('Cookie', cookie).send({
      address: '', phone: '+375291234567', email: 'test@test.com', paymentMethod: 'card'
    });
    expect(res.status).toBe(400);
  });

  test('POST /api/delivery — невалидный email', async () => {
    const res = await request(app).post('/api/delivery').set('Cookie', cookie).send({
      address: 'Test', phone: '+375291234567', email: 'not-an-email', paymentMethod: 'cash'
    });
    expect([201, 400]).toContain(res.status);
  });

  test('POST /api/delivery — XSS в адресе', async () => {
    const res = await request(app).post('/api/delivery').set('Cookie', cookie).send({
      address: '<script>alert("hacked")</script>', phone: '+375291234567',
      email: 'test@test.com', paymentMethod: 'card'
    });
    expect([201, 400]).toContain(res.status);
  });

  test('DELETE /api/delivery/:id — отмена уже отменённой', async () => {
    const deliveries = await request(app).get('/api/delivery').set('Cookie', cookie);
    const cancelledDelivery = deliveries.body.deliveries.find((d: any) => d.status === 'cancelled');
    if (!cancelledDelivery) return;
    const res = await request(app).delete(`/api/delivery/${cancelledDelivery.id}`).set('Cookie', cookie);
    expect([200, 400]).toContain(res.status);
  });

  test('DELETE /api/delivery/:id — чужой deliveryId', async () => {
    const res = await request(app).delete('/api/delivery/nonexistent-id').set('Cookie', cookie);
    expect(res.status).toBe(404);
  });

  test('POST /api/delivery — пустая корзина', async () => {
    await request(app).delete('/api/cart').set('Cookie', cookie);
    const res = await request(app).post('/api/delivery').set('Cookie', cookie).send({
      address: 'Test', phone: '+375291234567', email: 'test@test.com', paymentMethod: 'cash'
    });
    expect([201, 400]).toContain(res.status);
  });
});

// ========================
// ADMIN API
// ========================
describe('Admin API — CRUD', () => {
  let createdTankId = 0;

  beforeAll(async () => {
    cookie = await loginAs('test_delete_me@test.com', 'test123456');
    ownerCookie = await loginAs('owner@shop.com', 'owner123');
    expect(ownerCookie).toBeTruthy();
  });

  test('POST /api/catalog — owner создаёт товар', async () => {
    if (!ownerCookie) return;
    const res = await request(app)
      .post('/api/catalog').set('Cookie', ownerCookie)
      .field('name', 'TEST_TANK_DELETE_ME').field('nation', 'ussr').field('type', 'heavy')
      .field('level', '8').field('price', '5000').field('hp', '1500').field('dmg', '390')
      .field('inStock', 'true');
    expect(res.status).toBe(201);
    expect(res.body.product).toBeDefined();
    expect(res.body.product.id).toBeDefined();
    createdTankId = res.body.product.id;
  });

  test('POST /api/catalog — user получает 403', async () => {
    const res = await request(app)
      .post('/api/catalog').set('Cookie', cookie)
      .send({ name: 'Test', nation: 'ussr', type: 'heavy', level: 5, price: 100 });
    expect(res.status).toBe(403);
  });

  test('POST /api/catalog — пустые поля 400', async () => {
    if (!ownerCookie) return;
    const res = await request(app).post('/api/catalog').set('Cookie', ownerCookie).field('name', 'Incomplete Tank');
    expect(res.status).toBe(400);
  });

  test('PUT /api/catalog/:id — owner редактирует', async () => {
    if (!ownerCookie || !createdTankId) return;
    const res = await request(app).put(`/api/catalog/${createdTankId}`).set('Cookie', ownerCookie).field('price', '9999');
    expect(res.status).toBe(200);
    expect(res.body.product.price).toBe(9999);
  });

  test('PUT /api/catalog/:id — несуществующий id 404', async () => {
    if (!ownerCookie) return;
    const res = await request(app).put('/api/catalog/99999').set('Cookie', ownerCookie).field('price', '100');
    expect(res.status).toBe(404);
  });

  test('DELETE /api/catalog/:id/image — owner удаляет изображение', async () => {
    if (!ownerCookie || !createdTankId) return;
    const res = await request(app).delete(`/api/catalog/${createdTankId}/image`).set('Cookie', ownerCookie);
    expect(res.status).toBe(200);
  });

  test('DELETE /api/catalog/:id — owner удаляет товар', async () => {
    if (!ownerCookie || !createdTankId) return;
    const res = await request(app).delete(`/api/catalog/${createdTankId}`).set('Cookie', ownerCookie);
    expect(res.status).toBe(200);
  });

  test('DELETE /api/catalog/:id — несуществующий 404', async () => {
    if (!ownerCookie) return;
    const res = await request(app).delete('/api/catalog/99999').set('Cookie', ownerCookie);
    expect(res.status).toBe(404);
  });

  test('POST /api/catalog — без авторизации 401', async () => {
    const res = await request(app).post('/api/catalog').send({ name: 'Test', nation: 'ussr', type: 'heavy', level: 5, price: 100 });
    expect(res.status).toBe(401);
  });

  test('PUT /api/catalog/:id — без авторизации 401', async () => {
    const res = await request(app).put('/api/catalog/1').send({ price: '100' });
    expect(res.status).toBe(401);
  });
});

describe('Admin API — set-role', () => {
  beforeAll(async () => {
    cookie = await loginAs('test_delete_me@test.com', 'test123456');
    ownerCookie = await loginAs('owner@shop.com', 'owner123');
    expect(ownerCookie).toBeTruthy();
  });

  test('POST /api/auth/set-role — user получает 403', async () => {
    const res = await request(app)
      .post('/api/auth/set-role').set('Cookie', cookie)
      .send({ userId: 'some-id', role: 'admin' });
    expect(res.status).toBe(403);
  });

  test('POST /api/auth/set-role — owner назначает admin', async () => {
    if (!ownerCookie || !testUserId) return;
    const res = await request(app)
      .post('/api/auth/set-role').set('Cookie', ownerCookie)
      .send({ userId: testUserId, role: 'admin' });
    expect(res.status).toBe(200);
  });

  test('POST /api/auth/set-role — невалидная роль 400', async () => {
    if (!ownerCookie) return;
    const res = await request(app)
      .post('/api/auth/set-role').set('Cookie', ownerCookie)
      .send({ userId: testUserId, role: 'god' });
    expect(res.status).toBe(400);
  });

  test('POST /api/auth/set-role — пустые поля 400', async () => {
    if (!ownerCookie) return;
    const res = await request(app)
      .post('/api/auth/set-role').set('Cookie', ownerCookie)
      .send({});
    expect(res.status).toBe(400);
  });

  test('POST /api/auth/set-role — несуществующий userId', async () => {
    if (!ownerCookie) return;
    const res = await request(app)
      .post('/api/auth/set-role').set('Cookie', ownerCookie)
      .send({ userId: 'nonexistent-id', role: 'admin' });
    expect(res.status).toBe(500);
  });
});

describe('Admin API — краш-тесты с товарами', () => {
  beforeAll(async () => {
    ownerCookie = await loginAs('owner@shop.com', 'owner123');
    expect(ownerCookie).toBeTruthy();
  });

  test('POST /api/catalog — price = 0', async () => {
    if (!ownerCookie) return;
    const res = await request(app)
      .post('/api/catalog').set('Cookie', ownerCookie)
      .field('name', 'TEST_ZERO_PRICE').field('nation', 'ussr').field('type', 'medium')
      .field('level', '5').field('price', '0').field('inStock', 'true');
    expect([201, 400]).toContain(res.status);
    if (res.status === 201) {
      const id = res.body.product.id;
      await request(app).delete(`/api/catalog/${id}`).set('Cookie', ownerCookie);
    }
  });

  test('POST /api/catalog — price = -100 (отрицательная цена)', async () => {
    if (!ownerCookie) return;
    const res = await request(app)
      .post('/api/catalog').set('Cookie', ownerCookie)
      .field('name', 'TEST_NEG_PRICE').field('nation', 'ussr').field('type', 'heavy')
      .field('level', '8').field('price', '-100').field('inStock', 'true');
    expect([201, 400]).toContain(res.status);
  });

  test('PUT /api/catalog/:id — inStock=false (проверка Boolean("false") бага)', async () => {
    if (!ownerCookie) return;
    const createRes = await request(app)
      .post('/api/catalog').set('Cookie', ownerCookie)
      .field('name', 'TEST_INSTOCK').field('nation', 'ussr').field('type', 'heavy')
      .field('level', '8').field('price', '5000').field('inStock', 'true');
    expect(createRes.status).toBe(201);
    const id = createRes.body.product.id;
    const editRes = await request(app)
      .put(`/api/catalog/${id}`).set('Cookie', ownerCookie)
      .field('inStock', 'false');
    expect(editRes.status).toBe(200);
    expect(editRes.body.product.inStock).toBe(false);
    await request(app).delete(`/api/catalog/${id}`).set('Cookie', ownerCookie);
  });

  test('DELETE /api/catalog/:id — без авторизации 401', async () => {
    const res = await request(app).delete('/api/catalog/1');
    expect(res.status).toBe(401);
  });

  test('DELETE /api/catalog/:id/image — без авторизации 401', async () => {
    const res = await request(app).delete('/api/catalog/1/image');
    expect(res.status).toBe(401);
  });

  test('DELETE /api/catalog/:id/image — несуществующий товар', async () => {
    if (!ownerCookie) return;
    const res = await request(app).delete('/api/catalog/99999/image').set('Cookie', ownerCookie);
    expect(res.status).toBe(404);
  });

  test('POST /api/catalog без поля type/inStock/level — 400', async () => {
    if (!ownerCookie) return;
    const res = await request(app)
      .post('/api/catalog').set('Cookie', ownerCookie)
      .field('name', 'INCOMPLETE');
    expect(res.status).toBe(400);
  });
});

// ========================
// CLEANUP
// ========================
afterAll(async () => {
  const users = JSON.parse(await fs.readFile(USERS_FILE, 'utf-8'));
  const idx = users.findIndex((u: any) => u.email === 'test_delete_me@test.com');
  if (idx !== -1) {
    users.splice(idx, 1);
    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
  }

  const tanks = JSON.parse(await fs.readFile(TANKS_FILE, 'utf-8'));
  const tidx = tanks.findIndex((t: any) => t.name === 'TEST_TANK_DELETE_ME');
  if (tidx !== -1) {
    tanks.splice(tidx, 1);
    await fs.writeFile(TANKS_FILE, JSON.stringify(tanks, null, 2));
  }
  const otherTest = ['TEST_ZERO_PRICE', 'TEST_NEG_PRICE', 'TEST_INSTOCK'];
  for (const name of otherTest) {
    const oidx = tanks.findIndex((t: any) => t.name === name);
    if (oidx !== -1) {
      tanks.splice(oidx, 1);
    }
  }
  await fs.writeFile(TANKS_FILE, JSON.stringify(tanks, null, 2));
});
