import { apiCatalog } from '../services/api_catalog.js';
import { apiCart } from '../services/api_cart.js';
import { api } from '../services/api.js';
import { router } from '../main.js';
import { Product, ProductFilters } from '../types/index_catalog.js';

let currentFilters = {
  search: '',
  nation: '',
  type: '',
  level: 0,
  inStock: false,
  sortBy: '' as '' | 'price-asc' | 'price-desc'
};

// Сохраняем продукты для модального окна
let allProducts: Product[] = [];

export async function renderCatalogPage() {
  const app = document.getElementById('app');
  if (!app) return;

  try {
    const [productsRes, filtersRes] = await Promise.all([
      apiCatalog.getProducts(),
      apiCatalog.getFilters()
    ]);

    allProducts = productsRes.products;
    const filters: ProductFilters = filtersRes.filters;

    app.innerHTML = `
      <div class="wot-container">
        <!-- Шапка -->
        <div class="catalog-header">
          <div class="header-left">
            <h1 class="shop-title">IYHAN<span class="accent">SHOP</span></h1>
            <span class="catalog-subtitle">КАТАЛОГ ТАНКОВ</span>
          </div>
          <div class="header-right">
            <button class="wot-btn" id="main-btn">
              <i class="fas fa-home btn-icon"></i>
              Главная
            </button>
            <button class="wot-btn" id="cart-btn">
              <i class="fas fa-shopping-cart btn-icon"></i>
              Корзина
              <span class="cart-badge" id="cart-badge">0</span>
            </button>
            <button class="wot-btn" id="logout-btn">
              <i class="fas fa-sign-out-alt btn-icon"></i>
              Выйти
            </button>
          </div>
        </div>

        <!-- Поиск и фильтры -->
        <div class="catalog-filters">
          <div class="search-box">
            <i class="fas fa-search search-icon"></i>
            <input type="text" id="search-input" class="wot-input" placeholder="Поиск по названию..." value="${currentFilters.search}">
          </div>
          
          <div class="filters-row">
            <div class="filter-group">
              <label class="wot-label">Нация</label>
              <select id="nation-filter" class="wot-select">
                <option value="">Все нации</option>
                ${filters.nations.map(n => `<option value="${n}" ${currentFilters.nation === n ? 'selected' : ''}>${getNationName(n)}</option>`).join('')}
              </select>
            </div>

            <div class="filter-group">
              <label class="wot-label">Тип</label>
              <select id="type-filter" class="wot-select">
                <option value="">Все типы</option>
                ${filters.types.map(t => `<option value="${t}" ${currentFilters.type === t ? 'selected' : ''}>${getTypeName(t)}</option>`).join('')}
              </select>
            </div>

            <div class="filter-group">
              <label class="wot-label">Уровень</label>
              <select id="level-filter" class="wot-select">
                <option value="">Все уровни</option>
                ${filters.levels.map(l => `<option value="${l}" ${currentFilters.level === l ? 'selected' : ''}>${l} ур.</option>`).join('')}
              </select>
            </div>

            <div class="filter-group">
              <label class="wot-label">Сортировка</label>
              <select id="sort-filter" class="wot-select">
                <option value="">По умолчанию</option>
                <option value="price-asc" ${currentFilters.sortBy === 'price-asc' ? 'selected' : ''}>Цена ↑</option>
                <option value="price-desc" ${currentFilters.sortBy === 'price-desc' ? 'selected' : ''}>Цена ↓</option>
              </select>
            </div>

            <div class="filter-group checkbox-group">
              <label class="checkbox-label">
                <input type="checkbox" id="instock-filter" ${currentFilters.inStock ? 'checked' : ''}>
                <span>Только в наличии</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Результаты -->
        <div class="catalog-results">
          <p class="results-count">Найдено: <span id="products-count">${allProducts.length}</span> танков</p>
        </div>

        <!-- Сетка товаров -->
        <div class="catalog-grid" id="catalog-grid">
          ${allProducts.map(product => renderProductCard(product)).join('')}
        </div>

        <!-- Модальное окно -->
        <div class="modal-overlay" id="modal-overlay" style="display: none;">
          <div class="modal-content" id="modal-content">
            <!-- Контент модального окна будет добавлен динамически -->
          </div>
        </div>

        <!-- Футер -->
        <div class="shop-footer">
          <p>
            <i class="far fa-copyright"></i>
            2026 IYHANSHOP - Официальный магазин танков
          </p>
        </div>
      </div>
    `;

    // Обновляем счётчик корзины
    updateCartBadge();

    // Обработчики событий
    setupEventListeners();

  } catch (_err: unknown) {
    console.error(_err);
    router.navigateTo('/main');
  }
}

function renderProductCard(product: Product): string {
  return `
    <div class="product-card ${!product.inStock ? 'out-of-stock' : ''}" data-product-id="${product.id}" data-unit-price="${product.price}">
      <div class="product-image-container">
        <img src="/${product.img}" alt="${product.name}" class="product-image">
        <div class="product-badges">
          <span class="badge badge-level">${product.level} ур.</span>
          <span class="badge badge-type">${getTypeName(product.type)}</span>
          ${!product.inStock ? '<span class="badge badge-out">Нет в наличии</span>' : ''}
        </div>
      </div>
      <div class="product-info">
        <h3 class="product-name" data-title>${product.name}</h3>
        <p class="product-nation">
          <i class="fas fa-flag"></i> ${getNationName(product.nation)}
        </p>
        <div class="product-stats">
          <span><i class="fas fa-heart"></i> ${product.hp}</span>
          <span><i class="fas fa-crosshairs"></i> ${product.dmg}</span>
          <span><i class="fas fa-bolt"></i> ${product.dpm}</span>
        </div>
        ${product.description ? `<p class="product-description">${product.description}</p>` : ''}
        <div class="product-footer">
          <div class="product-price" id="price-${product.id}" data-base-price="${product.price}" data-price>
            <i class="fas fa-coins"></i>
            ${product.price.toLocaleString()}
          </div>
          <div class="product-actions">
            <div class="quantity-selector">
              <button class="qty-btn qty-minus" data-product="${product.id}">-</button>
              <span class="qty-value" id="qty-${product.id}">1</span>
              <button class="qty-btn qty-plus" data-product="${product.id}">+</button>
            </div>
            <button class="wot-btn wot-btn-primary add-to-cart-btn" 
                    data-product="${product.id}" 
                    ${!product.inStock ? 'disabled' : ''}>
              <i class="fas fa-cart-plus"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderModalContent(product: Product): string {
  return `
    <button class="modal-close" id="modal-close">&times;</button>
    <div class="modal-body">
      <div class="modal-image">
        <img src="/${product.img}" alt="${product.name}">
        <div class="modal-badges">
          <span class="badge badge-level">${product.level} ур.</span>
          <span class="badge badge-type">${getTypeName(product.type)}</span>
          ${!product.inStock ? '<span class="badge badge-out">Нет в наличии</span>' : ''}
        </div>
      </div>
      <div class="modal-info">
        <h2 class="modal-title">${product.name}</h2>
        <p class="modal-nation"><i class="fas fa-flag"></i> ${getNationName(product.nation)}</p>
        
        <div class="modal-stats">
          <div class="stat-item">
            <i class="fas fa-heart"></i>
            <span class="stat-label">Прочность</span>
            <span class="stat-value">${product.hp}</span>
          </div>
          <div class="stat-item">
            <i class="fas fa-crosshairs"></i>
            <span class="stat-label">Урон</span>
            <span class="stat-value">${product.dmg}</span>
          </div>
          <div class="stat-item">
            <i class="fas fa-bolt"></i>
            <span class="stat-label">ДПМ</span>
            <span class="stat-value">${product.dpm}</span>
          </div>
          <div class="stat-item">
            <i class="fas fa-bullseye"></i>
            <span class="stat-label">Точность</span>
            <span class="stat-value">${product.ptrs}</span>
          </div>
          <div class="stat-item">
            <i class="fas fa-sync-alt"></i>
            <span class="stat-label">Скорость башни</span>
            <span class="stat-value">${product.ptrp}</span>
          </div>
          <div class="stat-item">
            <i class="fas fa-tachometer-alt"></i>
            <span class="stat-label">Макс. скорость</span>
            <span class="stat-value">${product.spw}</span>
          </div>
        </div>
        
        ${product.description ? `<p class="modal-description">${product.description}</p>` : ''}
        
        <div class="modal-price" id="modal-price-${product.id}" data-base-price="${product.price}">
          <i class="fas fa-coins"></i>
          ${product.price.toLocaleString()}
        </div>
        
        <div class="modal-actions">
          <div class="quantity-selector modal-qty">
            <button class="qty-btn modal-qty-minus" data-product="${product.id}">-</button>
            <span class="qty-value" id="modal-qty-${product.id}">1</span>
            <button class="qty-btn modal-qty-plus" data-product="${product.id}">+</button>
          </div>
          <button class="wot-btn wot-btn-primary modal-add-btn" 
                  data-product="${product.id}"
                  ${!product.inStock ? 'disabled' : ''}>
            <i class="fas fa-cart-plus"></i>
            Добавить в корзину
          </button>
        </div>
      </div>
    </div>
  `;
}

function getNationName(nation: string): string {
  const nations: Record<string, string> = {
    'ussr': 'СССР',
    'germany': 'Германия',
    'usa': 'США',
    'france': 'Франция',
    'uk': 'Великобритания',
    'china': 'Китай',
    'japan': 'Япония',
    'czech': 'Чехия',
    'sweden': 'Швеция',
    'italy': 'Италия',
    'other': 'Другое'
  };
  return nations[nation] || nation;
}

function getTypeName(type: string): string {
  const types: Record<string, string> = {
    'heavy': 'ТТ',
    'medium': 'СТ',
    'light': 'ЛТ',
    'at': 'ПТ'
  };
  return types[type] || type;
}

async function updateCartBadge() {
  try {
    const count = await apiCart.getCartCount();
    const badge = document.getElementById('cart-badge');
    if (badge) {
      badge.textContent = count.count.toString();
      badge.style.display = count.count > 0 ? 'inline-block' : 'none';
    }
  } catch (_err: unknown) {
    // Игнорируем ошибки
  }
}

function openModal(productId: number) {
  const product = allProducts.find(p => p.id === productId);
  if (!product) return;
  
  const overlay = document.getElementById('modal-overlay');
  const content = document.getElementById('modal-content');
  
  if (overlay && content) {
    content.innerHTML = renderModalContent(product);
    overlay.style.display = 'flex';
    
    // Закрытие по клику на overlay
    overlay.onclick = (e) => {
      if (e.target === overlay) {
        closeModal();
      }
    };
    
    // Кнопка закрытия
    document.getElementById('modal-close')?.addEventListener('click', closeModal);
    
    // Обработчики для модального окна
    setupModalEventListeners(product);
  }
}

function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  if (overlay) {
    overlay.style.display = 'none';
  }
}

function setupModalEventListeners(product: Product) {
  // Кнопки количества
  const minusBtn = document.querySelector('.modal-qty-minus');
  const plusBtn = document.querySelector('.modal-qty-plus');
  const qtySpan = document.getElementById(`modal-qty-${product.id}`);
  const priceEl = document.getElementById(`modal-price-${product.id}`);
  
  minusBtn?.addEventListener('click', () => {
    if (!qtySpan) return;
    let qty = parseInt(qtySpan.textContent || '1');
    qty = Math.max(qty - 1, 1);
    qtySpan.textContent = qty.toString();
    updatePriceDisplay(priceEl, product.price, qty);
  });
  
  plusBtn?.addEventListener('click', () => {
    if (!qtySpan) return;
    let qty = parseInt(qtySpan.textContent || '1');
    qty = Math.min(qty + 1, 99);
    qtySpan.textContent = qty.toString();
    updatePriceDisplay(priceEl, product.price, qty);
  });
  
  // Добавление в корзину из модального окна
  const addBtn = document.querySelector('.modal-add-btn');
  addBtn?.addEventListener('click', async () => {
    const qty = parseInt(qtySpan?.textContent || '1');
    
    try {
      await apiCart.addToCart(product.id, qty);
      updateCartBadge();
      closeModal();
      
      // Показываем уведомление
      showNotification(`${product.name} (x${qty}) добавлен в корзину!`);
      } catch (err: unknown) {
        console.error(err);
        alert('Ошибка при добавлении в корзину');
      }
  });
}

function updatePriceDisplay(priceEl: HTMLElement | null, unitPrice: number, quantity: number) {
  if (priceEl) {
    const totalPrice = unitPrice * quantity;
    priceEl.innerHTML = `<i class="fas fa-coins"></i> ${totalPrice.toLocaleString()}`;
  }
}

function showNotification(message: string) {
  // Создаем уведомление
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
  document.body.appendChild(notification);
  
  // Анимация появления
  setTimeout(() => notification.classList.add('show'), 10);
  
  // Удаление через 3 секунды
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

function setupEventListeners() {
  // Поиск
  const searchInput = document.getElementById('search-input') as HTMLInputElement;
  let searchTimeout: number;
  searchInput?.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = window.setTimeout(() => {
      currentFilters.search = (e.target as HTMLInputElement).value;
      applyFilters();
    }, 300);
  });

  // Фильтры
  document.getElementById('nation-filter')?.addEventListener('change', (e) => {
    currentFilters.nation = (e.target as HTMLSelectElement).value;
    applyFilters();
  });

  document.getElementById('type-filter')?.addEventListener('change', (e) => {
    currentFilters.type = (e.target as HTMLSelectElement).value;
    applyFilters();
  });

  document.getElementById('level-filter')?.addEventListener('change', (e) => {
    currentFilters.level = parseInt((e.target as HTMLSelectElement).value) || 0;
    applyFilters();
  });

  document.getElementById('sort-filter')?.addEventListener('change', (e) => {
    currentFilters.sortBy = (e.target as HTMLSelectElement).value as '' | 'price-asc' | 'price-desc';
    applyFilters();
  });

  document.getElementById('instock-filter')?.addEventListener('change', (e) => {
    currentFilters.inStock = (e.target as HTMLInputElement).checked;
    applyFilters();
  });

  // Клики по карточкам - открываем модальное окно
  document.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      // Не открываем модалку если кликнули по кнопкам
      if (target.closest('.qty-btn') || target.closest('.add-to-cart-btn')) return;
      
      const productId = parseInt(card.getAttribute('data-product-id') || '0');
      openModal(productId);
    });
  });

  // Счётчики количества в карточках с обновлением цены
  document.querySelectorAll('.product-card .qty-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const target = e.target as HTMLElement;
      const card = target.closest('.product-card');
      const productId = target.getAttribute('data-product');
      const qtySpan = document.getElementById(`qty-${productId}`);
      const priceEl = document.getElementById(`price-${productId}`);
      const unitPrice = parseInt(card?.getAttribute('data-unit-price') || '0');
      
      if (!qtySpan) return;
      
      let qty = parseInt(qtySpan.textContent || '1');
      if (target.classList.contains('qty-plus')) {
        qty = Math.min(qty + 1, 99);
      } else {
        qty = Math.max(qty - 1, 1);
      }
      qtySpan.textContent = qty.toString();
      
      // Обновляем цену
      updatePriceDisplay(priceEl, unitPrice, qty);
    });
  });

  // Добавление в корзину из карточки
  document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const target = e.currentTarget as HTMLElement;
      const productId = parseInt(target.getAttribute('data-product') || '0');
      const card = target.closest('.product-card');
      const qtySpan = card?.querySelector('.qty-value');
      const quantity = parseInt(qtySpan?.textContent || '1');
      
      try {
        await apiCart.addToCart(productId, quantity);
        updateCartBadge();
        
        // Сбрасываем количество
        if (qtySpan) qtySpan.textContent = '1';
        
        // Восстанавливаем цену
        const unitPrice = parseInt(card?.getAttribute('data-unit-price') || '0');
        const priceEl = document.getElementById(`price-${productId}`);
        updatePriceDisplay(priceEl, unitPrice, 1);
        
        // Показываем уведомление
        const product = allProducts.find(p => p.id === productId);
        if (product) {
          showNotification(`${product.name} (x${quantity}) добавлен в корзину!`);
        }
      } catch (err: unknown) {
        console.error(err);
        alert('Ошибка при добавлении в корзину');
      }
    });
  });

  // Навигация
  document.getElementById('main-btn')?.addEventListener('click', () => {
    router.navigateTo('/main');
  });

  document.getElementById('cart-btn')?.addEventListener('click', () => {
    router.navigateTo('/cart');
  });

  document.getElementById('logout-btn')?.addEventListener('click', async () => {
    try {
      await api.logout();
      router.navigateTo('/');
    } catch (_err: unknown) {
      router.navigateTo('/');
    }
  });
  
  // Закрытие модального окна по Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
    }
  });
}

async function applyFilters() {
  try {
    const params = {
      search: currentFilters.search || undefined,
      nation: currentFilters.nation || undefined,
      type: currentFilters.type || undefined,
      level: currentFilters.level || undefined,
      inStock: currentFilters.inStock ? true : undefined,
      sortBy: currentFilters.sortBy || undefined
    };

    const response = await apiCatalog.getProducts(params);
    allProducts = response.products;
    
    const grid = document.getElementById('catalog-grid');
    const countSpan = document.getElementById('products-count');

    if (grid) {
      grid.innerHTML = allProducts.map(product => renderProductCard(product)).join('');
      setupEventListeners();
    }

    if (countSpan) {
      countSpan.textContent = allProducts.length.toString();
    }
  } catch (err: unknown) {
    console.error(err);
  }
}