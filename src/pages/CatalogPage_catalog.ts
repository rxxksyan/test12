import { apiCatalog } from '../services/api_catalog.js';
import { apiCart } from '../services/api_cart.js';
import { api } from '../services/api.js';
import { router } from '../main.js';
import { Product, ProductFilters } from '../types/index_catalog.js';
import { t } from '../services/locale.js';

interface ReviewItem {
  id: string;
  productId: number;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

let currentFilters = {
  search: '',
  nation: '',
  type: '',
  level: 0,
  inStock: false,
  sortBy: '' as '' | 'price-asc' | 'price-desc'
};

let allProducts: Product[] = [];
let recommendedIds: Set<number> = new Set();

// ---- Cookie для времени жизни рекомендаций (3 дня) ----
const RECO_COOKIE = 'ls_reco';
const RECO_TTL_MS = 3 * 24 * 60 * 60 * 1000; // 3 дня

function getRecoCookie(): number {
  const match = document.cookie.match(new RegExp(`(^| )${RECO_COOKIE}=([^;]+)`));
  return match ? parseInt(match[2]) || 0 : 0;
}

function setRecoCookie(): void {
  const expires = new Date(Date.now() + RECO_TTL_MS).toUTCString();
  document.cookie = `${RECO_COOKIE}=${Date.now()}; expires=${expires}; path=/; SameSite=Lax`;
}

function isRecoFresh(): boolean {
  const ts = getRecoCookie();
  if (!ts) return false;
  return (Date.now() - ts) < RECO_TTL_MS;
}

function getNationName(nation: string): string {
  const nations: Record<string, string> = {
    'ussr': t('nation.ussr'),
    'germany': t('nation.germany'),
    'usa': t('nation.usa'),
    'france': t('nation.france'),
    'uk': t('nation.uk'),
    'china': t('nation.china'),
    'japan': t('nation.japan'),
    'czech': t('nation.czech'),
    'sweden': t('nation.sweden'),
    'italy': t('nation.italy'),
    'other': t('nation.other')
  };
  return nations[nation] || nation;
}

function getTypeName(type: string): string {
  const types: Record<string, string> = {
    'heavy': t('type.heavy'),
    'medium': t('type.medium'),
    'light': t('type.light'),
    'at': t('type.at')
  };
  return types[type] || type;
}

export async function renderCatalogPage() {
  const app = document.getElementById('app');
  if (!app) return;

  delegatedReady = false;

  try {
    const recoPromise = isRecoFresh()
      ? fetch('/api/catalog/recommended', { credentials: 'include' }).then(r => r.json())
      : Promise.resolve({ products: [] });

    const [productsRes, filtersRes, recRes] = await Promise.all([
      apiCatalog.getProducts(),
      apiCatalog.getFilters(),
      recoPromise
    ]);

    allProducts = productsRes.products;
    recommendedIds = new Set((recRes.products || []).map((p: Product) => p.id));
    const filters: ProductFilters = filtersRes.filters;

    app.innerHTML = `
      <div class="wot-container">
        <div class="catalog-header">
          <div class="header-left">
            <h1 class="shop-title">IYHAN<span class="accent">SHOP</span></h1>
            <span class="catalog-subtitle">${t('catalog.title')}</span>
          </div>
          <div class="header-right">
            <button class="wot-btn" id="main-btn">
              <i class="fas fa-home btn-icon"></i>
              ${t('nav.home')}
            </button>
            <button class="wot-btn" id="cart-btn">
              <i class="fas fa-shopping-cart btn-icon"></i>
              ${t('nav.cart')}
              <span class="cart-badge" id="cart-badge">0</span>
            </button>
            <button class="wot-btn" id="admin-btn" style="display:none;">
              <i class="fas fa-cog btn-icon"></i>
              ${t('nav.admin')}
            </button>
            <button class="wot-btn" id="logout-btn">
              <i class="fas fa-sign-out-alt btn-icon"></i>
              ${t('nav.logout')}
            </button>
          </div>
        </div>

        <div class="catalog-filters">
          <div class="search-box">
            <i class="fas fa-search search-icon"></i>
            <input type="text" id="search-input" class="wot-input" placeholder="${t('catalog.search')}" value="${currentFilters.search}">
          </div>
          
          <div class="filters-row">
            <div class="filter-group">
              <label class="wot-label">${t('catalog.filter.nation')}</label>
              <select id="nation-filter" class="wot-select">
                <option value="">${t('catalog.filter.allNations')}</option>
                ${filters.nations.map(n => `<option value="${n}" ${currentFilters.nation === n ? 'selected' : ''}>${getNationName(n)}</option>`).join('')}
              </select>
            </div>

            <div class="filter-group">
              <label class="wot-label">${t('catalog.filter.type')}</label>
              <select id="type-filter" class="wot-select">
                <option value="">${t('catalog.filter.allTypes')}</option>
                ${filters.types.map(tp => `<option value="${tp}" ${currentFilters.type === tp ? 'selected' : ''}>${getTypeName(tp)}</option>`).join('')}
              </select>
            </div>

            <div class="filter-group">
              <label class="wot-label">${t('catalog.filter.level')}</label>
              <select id="level-filter" class="wot-select">
                <option value="">${t('catalog.filter.allLevels')}</option>
                ${filters.levels.map(l => `<option value="${l}" ${currentFilters.level === l ? 'selected' : ''}>${l} ${t('badge.level')}</option>`).join('')}
              </select>
            </div>

            <div class="filter-group">
              <label class="wot-label">${t('catalog.filter.sort')}</label>
              <select id="sort-filter" class="wot-select">
                <option value="">${t('catalog.filter.default')}</option>
                <option value="price-asc" ${currentFilters.sortBy === 'price-asc' ? 'selected' : ''}>${t('catalog.filter.priceAsc')}</option>
                <option value="price-desc" ${currentFilters.sortBy === 'price-desc' ? 'selected' : ''}>${t('catalog.filter.priceDesc')}</option>
              </select>
            </div>

            <div class="filter-group checkbox-group">
              <label class="checkbox-label">
                <input type="checkbox" id="instock-filter" ${currentFilters.inStock ? 'checked' : ''}>
                <span>${t('catalog.filter.instock')}</span>
              </label>
            </div>
          </div>
        </div>

        <div class="catalog-results">
          <p class="results-count">${t('catalog.found')} <span id="products-count">${allProducts.length}</span> ${t('catalog.foundSuffix')}</p>
        </div>

        <div class="catalog-grid" id="catalog-grid">
          ${renderProductGrid()}
        </div>

        <div class="modal-overlay" id="modal-overlay" style="display: none;">
          <div class="modal-content" id="modal-content">
          </div>
        </div>

        <div class="shop-footer">
          <p>
            <i class="far fa-copyright"></i>
            2026 IYHANSHOP - ${t('common.footer')}
          </p>
        </div>
      </div>
    `;

    updateCartBadge();
    checkAdminRole();
    setupEventListeners();

  } catch (_err: unknown) {
    console.error(_err);
    router.navigateTo('/main');
  }
}

async function checkAdminRole() {
  try {
    const me = await api.getMe();
    const adminBtn = document.getElementById('admin-btn');
    if (adminBtn && me.user) {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.user?.role === 'admin' || data.user?.role === 'owner') {
        adminBtn.style.display = 'inline-block';
      }
    }
  } catch {}
}

async function refreshRecommended() {
  try {
    setRecoCookie();
    const res = await fetch('/api/catalog/recommended', { credentials: 'include' });
    const data = await res.json();
    recommendedIds = new Set((data.products || []).map((p: Product) => p.id));
    const grid = document.getElementById('catalog-grid');
    if (grid) {
      grid.innerHTML = renderProductGrid();
    }
  } catch {}
}

function renderProductGrid(): string {
  const rec = allProducts.filter(p => recommendedIds.has(p.id));
  const normal = allProducts.filter(p => !recommendedIds.has(p.id));
  return [
    ...rec.map(p => renderProductCard(p, true)),
    ...normal.map(p => renderProductCard(p, false))
  ].join('');
}

function renderProductCard(product: Product, isRecommended?: boolean): string {
  return `
    <div class="product-card ${!product.inStock ? 'out-of-stock' : ''} ${isRecommended ? 'recommended' : ''}" data-product-id="${product.id}" data-unit-price="${product.price}">
      <div class="product-image-container">
        <img src="/${product.img}" alt="${product.name}" class="product-image">
        <div class="product-badges">
          ${isRecommended ? `<span class="badge badge-recommended"><i class="fas fa-thumbs-up"></i> ${t('catalog.recommended')}</span>` : ''}
          <span class="badge badge-level">${product.level} ${t('badge.level')}</span>
          <span class="badge badge-type">${getTypeName(product.type)}</span>
          ${!product.inStock ? `<span class="badge badge-out">${t('badge.outOfStock')}</span>` : ''}
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
            <button class="wot-btn like-btn" data-product="${product.id}" title="${t('catalog.like')}">
              <i class="fas fa-thumbs-up"></i>
            </button>
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
          <span class="badge badge-level">${product.level} ${t('badge.level')}</span>
          <span class="badge badge-type">${getTypeName(product.type)}</span>
          ${!product.inStock ? `<span class="badge badge-out">${t('badge.outOfStock')}</span>` : ''}
        </div>
      </div>
      <div class="modal-info">
        <h2 class="modal-title">${product.name}</h2>
        <p class="modal-nation"><i class="fas fa-flag"></i> ${getNationName(product.nation)}</p>
        
        <div class="modal-stats">
          <div class="stat-item">
            <i class="fas fa-heart"></i>
            <span class="stat-label">${product.hp}</span>
            <span class="stat-value">HP</span>
          </div>
          <div class="stat-item">
            <i class="fas fa-crosshairs"></i>
            <span class="stat-label">${product.dmg}</span>
            <span class="stat-value">DMG</span>
          </div>
          <div class="stat-item">
            <i class="fas fa-bolt"></i>
            <span class="stat-label">${product.dpm}</span>
            <span class="stat-value">DPM</span>
          </div>
          <div class="stat-item">
            <i class="fas fa-bullseye"></i>
            <span class="stat-label">${product.ptrs}</span>
            <span class="stat-value">ACC</span>
          </div>
          <div class="stat-item">
            <i class="fas fa-sync-alt"></i>
            <span class="stat-label">${product.ptrp}</span>
            <span class="stat-value">TRAV</span>
          </div>
          <div class="stat-item">
            <i class="fas fa-tachometer-alt"></i>
            <span class="stat-label">${product.spw}</span>
            <span class="stat-value">SPD</span>
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
            ${t('catalog.addToCart')}
          </button>
        </div>

        <div class="modal-reviews" id="modal-reviews-${product.id}">
          <hr class="summary-divider">
          <h3 class="reviews-title">
            <i class="fas fa-star"></i>
            ${t('review.average')}: <span id="review-avg-${product.id}">-</span>
          </h3>
          <div id="reviews-list-${product.id}">
            <p class="text-dim">${t('common.loading')}</p>
          </div>
          <div id="review-form-container-${product.id}"></div>
        </div>
      </div>
    </div>
  `;
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
    
    overlay.onclick = (e) => {
      if (e.target === overlay) {
        closeModal();
      }
    };
    
    document.getElementById('modal-close')?.addEventListener('click', closeModal);
    
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
  
  const addBtn = document.querySelector('.modal-add-btn');
  addBtn?.addEventListener('click', async () => {
    const qty = parseInt(qtySpan?.textContent || '1');
    
    try {
      await apiCart.addToCart(product.id, qty);
      updateCartBadge();
      closeModal();
      
      showNotification(`${product.name} (x${qty}) ${t('catalog.added')}`);
      } catch (err: unknown) {
        console.error(err);
        alert('Ошибка при добавлении в корзину');
      }
  });

  loadReviews(product.id);
}

async function loadReviews(productId: number) {
  try {
    const res = await fetch(`/api/catalog/${productId}/reviews`);
    const data = await res.json();

    const avgEl = document.getElementById(`review-avg-${productId}`);
    if (avgEl) {
      avgEl.textContent = data.averageRating > 0 ? data.averageRating.toFixed(1) : '-';
    }

    const listEl = document.getElementById(`reviews-list-${productId}`);
    if (!listEl) return;

    if (data.reviews && data.reviews.length > 0) {
      listEl.innerHTML = data.reviews.map((r: ReviewItem) => `
        <div class="review-item">
          <div class="review-item-header">
            <strong>${r.userName}</strong>
            <span class="review-item-rating">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</span>
            <span class="review-item-date">${new Date(r.createdAt).toLocaleDateString()}</span>
          </div>
          <p class="review-item-comment">${r.comment}</p>
        </div>
      `).join('');
    } else {
      listEl.innerHTML = `<p class="text-dim">${t('review.noReviews')}</p>`;
    }

    const formContainer = document.getElementById(`review-form-container-${productId}`);
    if (!formContainer) return;

    try {
      const me = await api.getMe();
      if (me.user) {
        formContainer.innerHTML = `
          <div class="review-form">
            <h4>${t('review.leaveReview')}</h4>
            <div class="review-rating-select">
              <label>${t('review.yourRating')}:</label>
              <select id="review-rating-${productId}" class="wot-select" style="width: auto;">
                <option value="5">5 ★★★★★</option>
                <option value="4">4 ★★★★☆</option>
                <option value="3">3 ★★★☆☆</option>
                <option value="2">2 ★★☆☆☆</option>
                <option value="1">1 ★☆☆☆☆</option>
              </select>
            </div>
            <textarea id="review-comment-${productId}" class="wot-input" rows="2" placeholder="${t('review.yourComment')}"></textarea>
            <button class="wot-btn wot-btn-primary review-submit-btn" data-product="${productId}">
              <i class="fas fa-paper-plane"></i> ${t('review.submit')}
            </button>
          </div>
        `;

        document.querySelector(`.review-submit-btn[data-product="${productId}"]`)?.addEventListener('click', async () => {
          const rating = parseInt((document.getElementById(`review-rating-${productId}`) as HTMLSelectElement).value);
          const comment = (document.getElementById(`review-comment-${productId}`) as HTMLTextAreaElement).value.trim();

          if (!comment) {
            alert('Напишите комментарий');
            return;
          }

          try {
            const res = await fetch(`/api/catalog/${productId}/reviews`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ rating, comment })
            });
            if (res.status === 409) {
              const data = await res.json();
              alert(data.message || 'Вы уже оставили отзыв');
              return;
            }
            if (!res.ok) throw new Error('Ошибка');
            loadReviews(productId);
          } catch (err) {
            console.error(err);
            alert('Ошибка при отправке отзыва');
          }
        });
      } else {
        formContainer.innerHTML = `<p class="text-dim">${t('review.onlyRegistered')}</p>`;
      }
    } catch {
      formContainer.innerHTML = `<p class="text-dim">${t('review.onlyRegistered')}</p>`;
    }
  } catch (err) {
    console.error(err);
  }
}

async function likeBtnHandler(e: MouseEvent) {
  const btn = (e.target as HTMLElement).closest('.like-btn') as HTMLElement | null;
  if (!btn) return;
  e.stopPropagation();
  const productId = btn.getAttribute('data-product');

  try {
    const res = await fetch(`/api/catalog/${productId}/like`, { method: 'POST' });
    if (!res.ok) {
      const data = await res.json();
      if (res.status === 401) {
        alert(data.message || 'Авторизуйтесь для оценки');
        return;
      }
      if (res.status === 409) {
        alert(data.message || 'Вы уже оценили этот товар');
        return;
      }
      throw new Error(data.message);
    }
    btn.classList.add('liked');
    setRecoCookie();
    showNotification(t('catalog.like'));
    refreshRecommended();
  } catch (err) {
    console.error(err);
  }
}

function updatePriceDisplay(priceEl: HTMLElement | null, unitPrice: number, quantity: number) {
  if (priceEl) {
    const totalPrice = unitPrice * quantity;
    priceEl.innerHTML = `<i class="fas fa-coins"></i> ${totalPrice.toLocaleString()}`;
  }
}

function showNotification(message: string) {
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
  document.body.appendChild(notification);
  
  setTimeout(() => notification.classList.add('show'), 10);
  
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

let delegatedReady = false;

function handleCardClick(e: MouseEvent) {
  const card = (e.target as HTMLElement).closest('.product-card') as HTMLElement | null;
  if (!card) return;
  const target = e.target as HTMLElement;
  if (target.closest('.qty-btn') || target.closest('.add-to-cart-btn') || target.closest('.like-btn')) return;
  const productId = parseInt(card.getAttribute('data-product-id') || '0');
  openModal(productId);
}

function handleQtyClick(e: MouseEvent) {
  const target = e.target as HTMLElement;
  const btn = target.closest('.qty-btn') as HTMLElement | null;
  if (!btn) return;
  e.stopPropagation();
  const productId = btn.getAttribute('data-product');
  const card = btn.closest('.product-card');
  const qtySpan = document.getElementById(`qty-${productId}`);
  const priceEl = document.getElementById(`price-${productId}`);
  const unitPrice = parseInt(card?.getAttribute('data-unit-price') || '0');
  if (!qtySpan) return;
  let qty = parseInt(qtySpan.textContent || '1');
  if (btn.classList.contains('qty-plus')) {
    qty = Math.min(qty + 1, 99);
  } else {
    qty = Math.max(qty - 1, 1);
  }
  qtySpan.textContent = qty.toString();
  updatePriceDisplay(priceEl, unitPrice, qty);
}

async function handleAddToCartClick(e: MouseEvent) {
  const btn = (e.target as HTMLElement).closest('.add-to-cart-btn') as HTMLElement | null;
  if (!btn) return;
  e.stopPropagation();
  const productId = parseInt(btn.getAttribute('data-product') || '0');
  const card = btn.closest('.product-card');
  const qtySpan = card?.querySelector('.qty-value');
  const quantity = parseInt(qtySpan?.textContent || '1');

  try {
    await apiCart.addToCart(productId, quantity);
    updateCartBadge();

    if (qtySpan) qtySpan.textContent = '1';

    const unitPrice = parseInt(card?.getAttribute('data-unit-price') || '0');
    const priceEl = document.getElementById(`price-${productId}`);
    updatePriceDisplay(priceEl, unitPrice, 1);

    const product = allProducts.find(p => p.id === productId);
    if (product) {
      showNotification(`${product.name} (x${quantity}) ${t('catalog.added')}`);
    }
  } catch (err: unknown) {
    console.error(err);
    alert('Ошибка при добавлении в корзину');
  }
}

function setupDelegatedListeners() {
  if (delegatedReady) return;
  const grid = document.getElementById('catalog-grid');
  if (!grid) return;
  grid.addEventListener('click', handleCardClick);
  grid.addEventListener('click', handleQtyClick);
  grid.addEventListener('click', handleAddToCartClick);
  grid.addEventListener('click', likeBtnHandler);
  delegatedReady = true;
}

function setupEventListeners() {
  const searchInput = document.getElementById('search-input') as HTMLInputElement;
  let searchTimeout: number;
  searchInput?.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = window.setTimeout(() => {
      currentFilters.search = (e.target as HTMLInputElement).value;
      applyFilters();
    }, 300);
  });

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

  setupDelegatedListeners();

  document.getElementById('main-btn')?.addEventListener('click', () => {
    router.navigateTo('/main');
  });

  document.getElementById('cart-btn')?.addEventListener('click', () => {
    router.navigateTo('/cart');
  });

  document.getElementById('admin-btn')?.addEventListener('click', () => {
    router.navigateTo('/admin');
  });

  document.getElementById('logout-btn')?.addEventListener('click', async () => {
    try {
      await api.logout();
      router.navigateTo('/');
    } catch (_err: unknown) {
      router.navigateTo('/');
    }
  });
  
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

    const recoPromise = isRecoFresh()
      ? fetch('/api/catalog/recommended', { credentials: 'include' }).then(r => r.json())
      : Promise.resolve({ products: [] });

    const [response, recRes] = await Promise.all([
      apiCatalog.getProducts(params),
      recoPromise
    ]);
    allProducts = response.products;
    recommendedIds = new Set((recRes.products || []).map((p: Product) => p.id));
    
    const grid = document.getElementById('catalog-grid');
    const countSpan = document.getElementById('products-count');

    if (grid) {
      grid.innerHTML = renderProductGrid();
    }

    if (countSpan) {
      countSpan.textContent = allProducts.length.toString();
    }
  } catch (err: unknown) {
    console.error(err);
  }
}
