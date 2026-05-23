import { apiCart } from '../services/api_cart.js';
import { api } from '../services/api.js';
import { router } from '../main.js';
import { CartItem } from '../types/index_cart.js';

let cartItems: CartItem[] = [];
let cartTotal = 0;

export async function renderCartPage() {
  const app = document.getElementById('app');
  if (!app) return;

  app.innerHTML = `
    <div class="wot-container">
      <div class="loading-message" style="text-align: center; padding: 50px;">
        <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: var(--wot-primary);"></i>
        <p style="margin-top: 20px;">Загрузка корзины...</p>
      </div>
    </div>
  `;

  try {
    const cartData = await apiCart.getCart();
    cartItems = cartData.cart.items || [];
    cartTotal = cartData.total || 0;

    app.innerHTML = `
      <div class="wot-container">
        <!-- Шапка -->
        <div class="cart-header">
          <div class="header-left">
            <h1 class="shop-title">IYHAN<span class="accent">SHOP</span></h1>
            <span class="cart-subtitle">КОРЗИНА</span>
          </div>
          <div class="header-right">
            <button class="wot-btn" id="catalog-btn">
              <i class="fas fa-store btn-icon"></i>
              Каталог
            </button>
            <button class="wot-btn" id="main-btn">
              <i class="fas fa-home btn-icon"></i>
              Главная
            </button>
            <button class="wot-btn" id="logout-btn">
              <i class="fas fa-sign-out-alt btn-icon"></i>
              Выйти
            </button>
          </div>
        </div>

        <div class="cart-content">
          <!-- Левая часть - товары -->
          <div class="cart-items-section">
            <h2 class="section-title">
              <i class="fas fa-shopping-cart"></i>
              Ваши товары
            </h2>
            
            ${cartItems.length === 0 ? `
              <div class="cart-empty">
                <i class="fas fa-shopping-basket cart-empty-icon"></i>
                <p>Корзина пуста</p>
                <button class="wot-btn wot-btn-primary" id="go-catalog-btn">
                  Перейти к покупкам
                </button>
              </div>
            ` : `
              <div class="cart-items-list" id="cart-items-list">
                ${cartItems.map(item => renderCartItem(item)).join('')}
              </div>
              
              <button class="wot-btn clear-cart-btn" id="clear-cart-btn">
                <i class="fas fa-trash-alt"></i>
                Очистить корзину
              </button>
            `}
          </div>

          <!-- Правая часть - итоги -->
          ${cartItems.length > 0 ? `
            <div class="cart-summary-section">
              <div class="cart-summary">
                <h3 class="summary-title">Итого</h3>
                
                <div class="summary-row">
                  <span>Товаров:</span>
                  <span id="items-count">${cartItems.reduce((sum, item) => sum + item.quantity, 0)} шт.</span>
                </div>
                
                <div class="summary-row">
                  <span>Сумма:</span>
                  <span class="summary-price" id="total-price">
                    <i class="fas fa-coins"></i>
                    ${cartTotal.toLocaleString()}
                  </span>
                </div>

                <hr class="summary-divider">

                <div class="summary-row summary-total">
                  <span>К оплате:</span>
                  <span class="total-price-value" data-price="basket">
                    <i class="fas fa-coins"></i>
                    ${cartTotal.toLocaleString()}
                  </span>
                </div>

                <button class="wot-btn wot-btn-primary checkout-btn" id="checkout-btn">
                  <i class="fas fa-truck"></i>
                  Оформить доставку
                </button>
              </div>
            </div>
          ` : ''}
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

    setupEventListeners();

  } catch (err: unknown) {
    console.error('Ошибка загрузки корзины:', err);
    app.innerHTML = `
      <div class="wot-container">
        <div class="error-message" style="text-align: center; padding: 50px;">
          <i class="fas fa-exclamation-circle" style="font-size: 3rem; color: #d32f2f;"></i>
          <h2 style="margin-top: 20px;">Ошибка загрузки корзины</h2>
          <p style="color: #888; margin: 10px 0;">Пожалуйста, авторизуйтесь и попробуйте снова</p>
          <button class="wot-btn wot-btn-primary" onclick="window.location.reload()" style="margin-top: 20px;">
            <i class="fas fa-sync-alt"></i> Обновить страницу
          </button>
          <button class="wot-btn" id="to-catalog-btn" style="margin-left: 10px;">
            <i class="fas fa-store"></i> В каталог
          </button>
        </div>
      </div>
    `;
    
    document.getElementById('to-catalog-btn')?.addEventListener('click', () => {
      router.navigateTo('/catalog');
    });
  }
}

function renderCartItem(item: CartItem): string {
  return `
    <div class="cart-item" data-product-id="${item.productId}" data-price="${item.product.price}">
      <div class="cart-item-image">
        <img src="/${item.product.img}" alt="${item.product.name}">
      </div>
      
      <div class="cart-item-info">
        <h4 class="cart-item-name" data-title="basket">${item.product.name}</h4>
        <div class="cart-item-details">
          <span class="item-level">${item.product.level} ур.</span>
          <span class="item-type">${getTypeName(item.product.type)}</span>
          <span class="item-nation">${getNationName(item.product.nation)}</span>
        </div>
        <p class="cart-item-price" data-price="basket">
          <i class="fas fa-coins"></i>
          ${item.product.price.toLocaleString()} за шт.
        </p>
      </div>
      
      <div class="cart-item-quantity">
        <button class="qty-btn qty-minus" data-product="${item.productId}">-</button>
        <span class="qty-value" id="qty-${item.productId}">${item.quantity}</span>
        <button class="qty-btn qty-plus" data-product="${item.productId}">+</button>
      </div>
      
      <div class="cart-item-total">
        <p class="item-total-label">Сумма:</p>
        <p class="item-total-price" id="total-${item.productId}">
          <i class="fas fa-coins"></i>
          ${(item.product.price * item.quantity).toLocaleString()}
        </p>
      </div>
      
      <button class="remove-item-btn" data-product="${item.productId}">
        <i class="fas fa-times"></i>
      </button>
    </div>
  `;
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

async function refreshCartDisplay() {
  try {
    const cartData = await apiCart.getCart();
    cartItems = cartData.cart.items || [];
    cartTotal = cartData.total || 0;
    
    const itemsCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    
    const countEl = document.getElementById('items-count');
    if (countEl) countEl.textContent = `${itemsCount} шт.`;

    const priceEl = document.getElementById('total-price');
    if (priceEl) priceEl.innerHTML = `<i class="fas fa-coins"></i> ${cartTotal.toLocaleString()}`;

    const totalPriceEl = document.querySelector('.total-price-value');
    if (totalPriceEl) totalPriceEl.innerHTML = `<i class="fas fa-coins"></i> ${cartTotal.toLocaleString()}`;

    if (cartItems.length === 0) {
      renderCartPage();
    }
  } catch (err: unknown) {
    console.error('Ошибка обновления корзины:', err);
  }
}

function setupEventListeners() {
  document.getElementById('catalog-btn')?.addEventListener('click', () => {
    router.navigateTo('/catalog');
  });

  document.getElementById('main-btn')?.addEventListener('click', () => {
    router.navigateTo('/main');
  });

  document.getElementById('go-catalog-btn')?.addEventListener('click', () => {
    router.navigateTo('/catalog');
  });

  document.getElementById('logout-btn')?.addEventListener('click', async () => {
    try {
      await api.logout();
      router.navigateTo('/');
    } catch (_err: unknown) {
      router.navigateTo('/');
    }
  });

  document.getElementById('checkout-btn')?.addEventListener('click', () => {
    router.navigateTo('/delivery');
  });

  document.getElementById('clear-cart-btn')?.addEventListener('click', async () => {
    if (confirm('Вы уверены, что хотите очистить корзину?')) {
      try {
        await apiCart.clearCart();
        cartItems = [];
        cartTotal = 0;
        renderCartPage();
      } catch (err: unknown) {
        console.error(err);
        alert('Ошибка при очистке корзины. Попробуйте ещё раз.');
      }
    }
  });

  document.querySelectorAll('.remove-item-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const target = e.currentTarget as HTMLElement;
      const productId = parseInt(target.getAttribute('data-product') || '0');
      
      try {
        await apiCart.removeFromCart(productId);
        
        cartItems = cartItems.filter(item => item.productId !== productId);
        
        const item = document.querySelector(`.cart-item[data-product-id="${productId}"]`);
        if (item) {
          item.classList.add('removing');
          setTimeout(() => {
            item.remove();
            if (cartItems.length === 0) {
              renderCartPage();
            } else {
              refreshCartDisplay();
            }
          }, 300);
        }
        } catch (err: unknown) {
          console.error(err);
          alert('Ошибка при удалении товара. Попробуйте ещё раз.');
        }
    });
  });

  document.querySelectorAll('.cart-item .qty-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const target = e.target as HTMLElement;
      const productId = parseInt(target.getAttribute('data-product') || '0');
      const cartItem = target.closest('.cart-item');
      const qtySpan = document.getElementById(`qty-${productId}`);
      
      if (!qtySpan || !cartItem) return;
      
      let qty = parseInt(qtySpan.textContent || '1');
      const unitPrice = parseInt(cartItem.getAttribute('data-price') || '0');
      
      if (target.classList.contains('qty-plus')) {
        qty++;
      } else {
        qty--;
      }

      if (qty < 1) {
        try {
          await apiCart.removeFromCart(productId);
          cartItems = cartItems.filter(item => item.productId !== productId);
          refreshCartDisplay();
        } catch (err: unknown) {
          console.error(err);
          alert('Ошибка при удалении товара. Попробуйте ещё раз.');
        }
        return;
      }

      try {
        await apiCart.updateQuantity(productId, qty);
        
        qtySpan.textContent = qty.toString();
        
        const itemTotal = cartItem.querySelector('.item-total-price');
        if (itemTotal) {
          itemTotal.innerHTML = `<i class="fas fa-coins"></i> ${(unitPrice * qty).toLocaleString()}`;
        }
        
        refreshCartDisplay();
      } catch (err: unknown) {
        console.error(err);
        alert('Ошибка при обновлении количества. Попробуйте ещё раз.');
      }
    });
  });
}