import { apiDelivery } from '../services/api_delivery.js';
import { apiCart } from '../services/api_cart.js';
import { api } from '../services/api.js';
import { router } from '../main.js';
import { DeliveryFormData } from '../types/index_delivery.js';

let captchaAnswer = 0;

export async function renderDeliveryPage() {
  const app = document.getElementById('app');
  if (!app) return;

  // Показываем загрузку
  app.innerHTML = `
    <div class="wot-container">
      <div class="loading-message" style="text-align: center; padding: 50px;">
        <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: var(--wot-primary);"></i>
        <p style="margin-top: 20px;">Загрузка оформления...</p>
      </div>
    </div>
  `;

  try {
    // Проверяем корзину
    const cartData = await apiCart.getCart();
    const items = cartData.cart.items || [];
    const total = cartData.total || 0;

    if (items.length === 0) {
      // Корзина пуста - идём в корзину
      router.navigateTo('/cart');
      return;
    }

    app.innerHTML = `
      <div class="wot-container">
        <!-- Шапка -->
        <div class="delivery-header">
          <div class="header-left">
            <h1 class="shop-title">IYHAN<span class="accent">SHOP</span></h1>
            <span class="delivery-subtitle">ОФОРМЛЕНИЕ ДОСТАВКИ</span>
          </div>
          <div class="header-right">
            <button class="wot-btn" id="cart-btn">
              <i class="fas fa-shopping-cart btn-icon"></i>
              Назад в корзину
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

        <div class="delivery-content">
          <!-- Левая часть - форма -->
          <div class="delivery-form-section">
            <h2 class="section-title">
              <i class="fas fa-truck"></i>
              Данные для доставки
            </h2>
            
            <form class="delivery-form" id="delivery-form" data-delivery>
              <div class="form-group">
                <label class="wot-label" for="address">
                  <i class="fas fa-user"></i>
                  Никнейм *
                </label>
                <input type="text" id="address" name="address" class="wot-input" 
                       placeholder="Ваш никнейм в игре" required>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="wot-label" for="phone">
                    <i class="fas fa-phone"></i>
                    Телефон *
                  </label>
                  <input type="tel" id="phone" name="phone" class="wot-input" 
                         placeholder="+375 (29) 123-45-67" required>
                </div>

                <div class="form-group">
                  <label class="wot-label" for="email">
                    <i class="fas fa-envelope"></i>
                    Email *
                  </label>
                  <input type="email" id="email" name="email" class="wot-input" 
                         placeholder="example@mail.com" required>
                </div>
              </div>

              <div class="form-group">
                <label class="wot-label">
                  <i class="fas fa-credit-card"></i>
                  Способ оплаты *
                </label>
                <div class="payment-methods">
                  <label class="payment-option">
                    <input type="radio" name="paymentMethod" value="card" checked>
                    <span class="payment-card">
                      <i class="fas fa-credit-card"></i>
                      Банковская карта
                    </span>
                  </label>
                  <label class="payment-option">
                    <input type="radio" name="paymentMethod" value="cash">
                    <span class="payment-cash">
                      <i class="fas fa-money-bill-wave"></i>
                      Наличными при получении
                    </span>
                  </label>
                </div>
              </div>

              <!-- Форма данных карты -->
              <div class="card-form" id="card-form">
                <div class="card-preview">
                  <div class="card-front">
                    <div class="card-chip"></div>
                    <div class="card-number-display" id="card-number-display">•••• •••• •••• ••••</div>
                    <div class="card-details">
                      <div class="card-holder-display">
                        <span class="card-label">Держатель</span>
                        <span id="card-holder-display">ИМЯ ФАМИЛИЯ</span>
                      </div>
                      <div class="card-expiry-display">
                        <span class="card-label">Срок</span>
                        <span id="card-expiry-display">MM/YY</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div class="card-inputs">
                  <div class="form-group">
                    <label class="wot-label" for="cardNumber">
                      <i class="fas fa-credit-card"></i>
                      Номер карты *
                    </label>
                    <input type="text" id="cardNumber" name="cardNumber" class="wot-input card-input" 
                           placeholder="0000 0000 0000 0000" maxlength="19" autocomplete="cc-number">
                  </div>
                  
                  <div class="form-group">
                    <label class="wot-label" for="cardHolder">
                      <i class="fas fa-user"></i>
                      Имя держателя *
                    </label>
                    <input type="text" id="cardHolder" name="cardHolder" class="wot-input" 
                           placeholder="IVAN IVANOV" autocomplete="cc-name">
                  </div>
                  
                  <div class="form-row">
                    <div class="form-group">
                      <label class="wot-label" for="cardExpiry">
                        <i class="fas fa-calendar"></i>
                        Срок действия *
                      </label>
                      <input type="text" id="cardExpiry" name="cardExpiry" class="wot-input" 
                             placeholder="MM/YY" maxlength="5" autocomplete="cc-exp">
                    </div>
                    
                    <div class="form-group">
                      <label class="wot-label" for="cardCvv">
                        <i class="fas fa-lock"></i>
                        CVV *
                      </label>
                      <input type="password" id="cardCvv" name="cardCvv" class="wot-input" 
                             placeholder="•••" maxlength="3" autocomplete="cc-csc">
                    </div>
                  </div>
                </div>
              </div>

              <!-- Капча -->
              <div class="form-group captcha-group">
                <label class="wot-label">
                  <i class="fas fa-shield-alt"></i>
                  Подтвердите, что вы не робот
                </label>
                <div class="captcha-box">
                  <span class="captcha-question" id="captcha-question"></span>
                  <input type="number" id="captcha-answer" class="wot-input captcha-input" 
                         placeholder="?" required>
                  <button type="button" class="wot-btn refresh-captcha" id="refresh-captcha">
                    <i class="fas fa-sync-alt"></i>
                  </button>
                </div>
              </div>

              <button type="submit" class="wot-btn wot-btn-primary submit-order-btn">
                <i class="fas fa-check"></i>
                Подтвердить заказ
              </button>
            </form>
          </div>

          <!-- Правая часть - сводка заказа -->
          <div class="delivery-summary-section">
            <div class="order-summary">
              <h3 class="summary-title">
                <i class="fas fa-clipboard-list"></i>
                Ваш заказ
              </h3>
              
              <div class="order-items">
                ${items.map(item => `
                  <div class="order-item">
                    <img src="/${item.product.img}" alt="${item.product.name}" class="order-item-img">
                    <div class="order-item-info">
                      <span class="order-item-name">${item.product.name}</span>
                      <span class="order-item-qty">x${item.quantity}</span>
                    </div>
                    <span class="order-item-price">
                      <i class="fas fa-coins"></i>
                      ${(item.product.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                `).join('')}
              </div>

              <hr class="summary-divider">

              <div class="summary-row summary-total">
                <span>Итого к оплате:</span>
                <span class="total-amount">
                  <i class="fas fa-coins"></i>
                  ${total.toLocaleString()}
                </span>
              </div>
            </div>

            <div class="delivery-info-box">
              <h4><i class="fas fa-info-circle"></i> Информация о доставке</h4>
              <ul>
                <li><i class="fas fa-check"></i> Срок доставки: 5-10 минут</li>
                <li><i class="fas fa-check"></i> Танк появится в вашем ангаре</li>
                <li><i class="fas fa-check"></i> Гарантия на все товары</li>
              </ul>
            </div>
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

    // Инициализация капчи
    generateCaptcha();
    setupEventListeners();

  } catch (err) {
    console.error('Ошибка загрузки страницы доставки:', err);
    // Показываем ошибку вместо перенаправления
    app.innerHTML = `
      <div class="wot-container">
        <div class="error-message" style="text-align: center; padding: 50px;">
          <i class="fas fa-exclamation-circle" style="font-size: 3rem; color: #d32f2f;"></i>
          <h2 style="margin-top: 20px;">Ошибка загрузки</h2>
          <p style="color: #888; margin: 10px 0;">Не удалось загрузить данные для оформления</p>
          <button class="wot-btn wot-btn-primary" onclick="window.location.reload()" style="margin-top: 20px;">
            <i class="fas fa-sync-alt"></i> Обновить страницу
          </button>
          <button class="wot-btn" id="back-cart-btn" style="margin-left: 10px;">
            <i class="fas fa-shopping-cart"></i> В корзину
          </button>
        </div>
      </div>
    `;
    
    document.getElementById('back-cart-btn')?.addEventListener('click', () => {
      router.navigateTo('/cart');
    });
  }
}

function generateCaptcha() {
  const a = Math.floor(Math.random() * 10) + 1;
  const b = Math.floor(Math.random() * 10) + 1;
  captchaAnswer = a + b;
  
  const questionEl = document.getElementById('captcha-question');
  if (questionEl) {
    questionEl.textContent = `${a} + ${b} = ?`;
  }
}

function setupEventListeners() {
  // Обновление капчи
  document.getElementById('refresh-captcha')?.addEventListener('click', () => {
    generateCaptcha();
    const input = document.getElementById('captcha-answer') as HTMLInputElement;
    if (input) input.value = '';
  });

  // Переключение способов оплаты
  document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      const cardForm = document.getElementById('card-form');
      if (cardForm) {
        if (target.value === 'card') {
          cardForm.style.display = 'block';
        } else {
          cardForm.style.display = 'none';
        }
      }
    });
  });

  // Форматирование номера карты
  const cardNumberInput = document.getElementById('cardNumber') as HTMLInputElement;
  cardNumberInput?.addEventListener('input', (e) => {
    const target = e.target as HTMLInputElement;
    let value = target.value.replace(/\s/g, '').replace(/\D/g, '');
    let formatted = '';
    for (let i = 0; i < value.length && i < 16; i++) {
      if (i > 0 && i % 4 === 0) formatted += ' ';
      formatted += value[i];
    }
    target.value = formatted;
    
    // Обновление превью карты
    const display = document.getElementById('card-number-display');
    if (display) {
      display.textContent = formatted || '•••• •••• •••• ••••';
    }
  });

  // Форматирование имени держателя
  const cardHolderInput = document.getElementById('cardHolder') as HTMLInputElement;
  cardHolderInput?.addEventListener('input', (e) => {
    const target = e.target as HTMLInputElement;
    target.value = target.value.toUpperCase();
    
    const display = document.getElementById('card-holder-display');
    if (display) {
      display.textContent = target.value || 'ИМЯ ФАМИЛИЯ';
    }
  });

  // Форматирование срока действия
  const cardExpiryInput = document.getElementById('cardExpiry') as HTMLInputElement;
  cardExpiryInput?.addEventListener('input', (e) => {
    const target = e.target as HTMLInputElement;
    let value = target.value.replace(/\D/g, '');
    if (value.length >= 2) {
      value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    target.value = value;
    
    const display = document.getElementById('card-expiry-display');
    if (display) {
      display.textContent = value || 'MM/YY';
    }
  });

  // Навигация
  document.getElementById('cart-btn')?.addEventListener('click', () => {
    router.navigateTo('/cart');
  });

  document.getElementById('main-btn')?.addEventListener('click', () => {
    router.navigateTo('/main');
  });

  document.getElementById('logout-btn')?.addEventListener('click', async () => {
    try {
      await api.logout();
      router.navigateTo('/');
    } catch {
      router.navigateTo('/');
    }
  });

  // Отправка формы
  document.getElementById('delivery-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const captchaInput = document.getElementById('captcha-answer') as HTMLInputElement;
    const userCaptchaAnswer = captchaInput ? parseInt(captchaInput.value) : 0;
    
    if (userCaptchaAnswer !== captchaAnswer) {
      alert('Неверный ответ на проверочный вопрос. Попробуйте ещё раз.');
      generateCaptcha();
      if (captchaInput) captchaInput.value = '';
      return;
    }

    const address = (document.getElementById('address') as HTMLInputElement)?.value;
    const phone = (document.getElementById('phone') as HTMLInputElement)?.value;
    const email = (document.getElementById('email') as HTMLInputElement)?.value;
    const paymentMethodEl = document.querySelector('input[name="paymentMethod"]:checked') as HTMLInputElement;
    const paymentMethod = paymentMethodEl?.value as 'card' | 'cash';

    if (!address || !phone || !email || !paymentMethod) {
      alert('Пожалуйста, заполните все обязательные поля');
      return;
    }

    // Валидация данных карты при оплате картой
    if (paymentMethod === 'card') {
      const cardNumber = (document.getElementById('cardNumber') as HTMLInputElement)?.value.replace(/\s/g, '');
      const cardHolder = (document.getElementById('cardHolder') as HTMLInputElement)?.value.trim();
      const cardExpiry = (document.getElementById('cardExpiry') as HTMLInputElement)?.value;
      const cardCvv = (document.getElementById('cardCvv') as HTMLInputElement)?.value;

      if (!cardNumber || cardNumber.length !== 16) {
        alert('Введите корректный номер карты (16 цифр)');
        return;
      }

      if (!cardHolder || cardHolder.length < 3) {
        alert('Введите имя держателя карты');
        return;
      }

      if (!cardExpiry || cardExpiry.length !== 5) {
        alert('Введите срок действия карты в формате MM/YY');
        return;
      }

      if (!cardCvv || cardCvv.length !== 3) {
        alert('Введите CVV код (3 цифры)');
        return;
      }
    }

    const deliveryData: DeliveryFormData = {
      address,
      phone,
      email,
      paymentMethod
    };

    const submitBtn = document.querySelector('.submit-order-btn') as HTMLButtonElement;
    
    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Оформление...';
      }

      const response = await apiDelivery.createDelivery(deliveryData);
      
      // Показываем успех
      showSuccessMessage(response.delivery.id);
      
    } catch (err) {
      console.error(err);
      alert('Ошибка при оформлении доставки. Попробуйте ещё раз.');
      
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-check"></i> Подтвердить заказ';
      }
    }
  });
}

function showSuccessMessage(deliveryId: string) {
  const app = document.getElementById('app');
  if (!app) return;

  app.innerHTML = `
    <div class="wot-container">
      <div class="success-page">
        <div class="success-icon">
          <i class="fas fa-check-circle"></i>
        </div>
        <h1 class="success-title">Заказ успешно оформлен!</h1>
        <p class="success-message">
          Ваш заказ #${deliveryId} принят в обработку.
        </p>
        <p class="success-details">
          Танки будут доставлены в ваш ангар в течение 5-10 минут.
        </p>
        <div class="success-actions">
          <button class="wot-btn wot-btn-primary" id="go-main-btn">
            <i class="fas fa-home"></i>
            На главную
          </button>
          <button class="wot-btn" id="go-catalog-btn">
            <i class="fas fa-store"></i>
            Продолжить покупки
          </button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('go-main-btn')?.addEventListener('click', () => {
    router.navigateTo('/main');
  });

  document.getElementById('go-catalog-btn')?.addEventListener('click', () => {
    router.navigateTo('/catalog');
  });
}