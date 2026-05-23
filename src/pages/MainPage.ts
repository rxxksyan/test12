import { api } from '../services/api.js';
import { apiCart } from '../services/api_cart.js';
import { router } from '../main.js';
import { AuthResponse } from '../types/index.js';

export async function renderMainPage() {
  const app = document.getElementById('app');
  if (!app) return;

  try {
    const response: AuthResponse = await api.getMe();
    const user = response.user;
    
    const topSellingTanks = [
      { 
        id: 1,
        name: 'Объект 140', 
        nation: 'СССР', 
        tier: 10, 
        price: 6200,
        image: '/images/tanks_main/object-140.png',
        advantage: 'Лучший СТ для рандома'
      },
      { 
        id: 9,
        name: 'ИС-7', 
        nation: 'СССР', 
        tier: 10, 
        price: 5900,
        image: '/images/tanks_main/is-7.png',
        advantage: 'Легендарный тяж'
      },
      { 
        id: 2,
        name: 'E 100', 
        nation: 'Германия', 
        tier: 10, 
        price: 6100,
        image: '/images/tanks_main/e-100.png',
        advantage: 'Непробиваемая броня'
      }
    ];

    const advantages = [
      { icon: 'fa-bolt', title: 'Мгновенная доставка', desc: 'Танк в ангаре через 5 минут' },
      { icon: 'fa-shield-alt', title: 'Гарантия качества', desc: 'Все танки с полным обслуживанием' },
      { icon: 'fa-tag', title: 'Лучшие цены', desc: 'На 20% дешевле чем в премиум магазине' },
      { icon: 'fa-gift', title: 'Бонусы за покупку', desc: 'Кэшбек до 10% золотом' }
    ];

    const newsItems = [
      { title: 'Скидка на советские танки', date: '27.02.2026', desc: '-15% на всю технику СССР' },
      { title: 'Новогодний ивент', date: '25.02.2026', desc: 'Специальные предложения' },
      { title: 'Пополнение в магазине', date: '20.02.2026', desc: 'Новые премиум танки' }
    ];
    
    app.innerHTML = `
      <div class="wot-container">
        <!-- Шапка с приветствием и навигацией -->
        <div class="shop-header">
          <div class="header-left">
            <h1 class="shop-title">IYHAN<span class="accent">SHOP</span></h1>
            <p class="welcome-message">
              <i class="fas fa-hand-peace" style="margin-right: 5px;"></i>
              С возвращением, командир ${user.nickname}!
            </p>
          </div>

          <div class="header-right">
            <button class="wot-btn wot-btn-primary" id="catalog-btn">
              <i class="fas fa-store btn-icon"></i>
              Каталог танков
            </button>
            <button class="wot-btn" id="cart-btn">
              <i class="fas fa-shopping-cart btn-icon"></i>
              Корзина
            </button>
            <button class="wot-btn" id="profile-btn">
              <i class="fas fa-user btn-icon"></i>
              Профиль
            </button>
            <button class="wot-btn" id="logout-btn">
              <i class="fas fa-sign-out-alt btn-icon"></i>
              Выйти
            </button>
          </div>

        </div>

        <!-- Промо-баннер -->
        <div class="promo-banner simple-timer-banner">
          <div class="promo-content">
            <span class="promo-tag">
              <i class="fas fa-clock"></i>
              ОГРАНИЧЕННОЕ ПРЕДЛОЖЕНИЕ
            </span>
            <h2 class="promo-title">Скидка 25% на премиум технику</h2>
            <p class="promo-text">
              Только сегодня! Успейте пополнить ангар редкими машинами.
            </p>
            <button class="wot-btn wot-btn-primary" id="promo-simple-btn">
              <i class="fas fa-gift btn-icon"></i>
              ПЕРЕЙТИ К АКЦИИ
            </button>
          </div>
          <div class="promo-decoration timer-decoration">
            <div class="timer-circle">
              <i class="fas fa-hourglass-half timer-icon"></i>
              <div class="timer-display" id="simple-timer">
                <span id="simple-hours">00</span>:<span id="simple-minutes">00</span>:<span id="simple-seconds">00</span>
              </div>
              <div class="timer-label">до конца</div>
            </div>
          </div>
        </div>

        <!-- Преимущества магазина -->
        <div class="advantages-section">
          <h2 class="section-title">
            <i class="fas fa-star" style="color: #ff7800; margin-right: 10px;"></i>
            Почему выбирают <span class="accent">IYHANSHOP</span>
          </h2>
          <div class="advantages-grid">
            ${advantages.map(adv => `
              <div class="advantage-card">
                <div class="advantage-icon">
                  <i class="fas ${adv.icon}"></i>
                </div>
                <h3 class="advantage-title">${adv.title}</h3>
                <p class="advantage-desc">${adv.desc}</p>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Топ продаж -->
        <div class="top-sales-section">
          <h2 class="section-title">
            <i class="fas fa-crown" style="color: #ff7800; margin-right: 10px;"></i>
            Топ продаж этой недели
          </h2>
          <div class="tanks-grid">
            ${topSellingTanks.map(tank => `
              <div class="tank-sale-card">
                <div class="tank-image-container">
                  <img src="${tank.image}" alt="${tank.name}" class="tank-image">
                  <span class="tank-tier">
                    <i class="fas fa-layer-group" style="margin-right: 3px;"></i>
                    ${tank.tier} ур.
                  </span>
                </div>
                <div class="tank-info">
                  <h3 class="tank-name">${tank.name}</h3>
                  <span class="tank-nation">
                    <i class="fas fa-flag" style="margin-right: 5px;"></i>
                    ${tank.nation}
                  </span>
                  <p class="tank-advantage">
                    <i class="fas fa-medal" style="color: #ff7800; margin-right: 5px;"></i>
                    ${tank.advantage}
                  </p>
                  <div class="tank-price-section">
                    <span class="tank-price">
                      <i class="fas fa-coins" style="margin-right: 5px;"></i>
                      ${tank.price.toLocaleString()}
                    </span>
                    <button class="wot-btn wot-btn-primary tank-buy-btn" data-tank-id="${tank.id}" data-tank-name="${tank.name}">
                      <i class="fas fa-shopping-cart" style="margin-right: 5px;"></i>
                      Купить
                    </button>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
          <div class="section-footer">
            <button class="wot-btn" id="view-all-tanks">
              Все танки 
              <i class="fas fa-arrow-right" style="margin-left: 8px;"></i>
            </button>
          </div>
        </div>

        <!-- Новости и события -->
        <div class="news-section">
          <h2 class="section-title">
            <i class="fas fa-newspaper" style="color: #ff7800; margin-right: 10px;"></i>
            Новости магазина
          </h2>
          <div class="news-grid">
            ${newsItems.map(news => `
              <div class="news-card">
                <div class="news-date">
                  <i class="far fa-calendar-alt" style="margin-right: 5px;"></i>
                  ${news.date}
                </div>
                <h3 class="news-title">${news.title}</h3>
                <p class="news-desc">${news.desc}</p>
                <a href="#" class="news-link">
                  Подробнее 
                  <i class="fas fa-arrow-right" style="margin-left: 5px; font-size: 0.8rem;"></i>
                </a>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Статистика магазина -->
        <div class="stats-bar">
          <div class="stat-item">
            <i class="fas fa-tachometer-alt stat-icon"></i>
            <span class="stat-value">1500+</span>
            <span class="stat-label">Танков продано</span>
          </div>
          <div class="stat-item">
            <i class="fas fa-star stat-icon"></i>
            <span class="stat-value">98%</span>
            <span class="stat-label">Довольных клиентов</span>
          </div>
          <div class="stat-item">
            <i class="fas fa-headset stat-icon"></i>
            <span class="stat-value">24/7</span>
            <span class="stat-label">Поддержка</span>
          </div>
          <div class="stat-item">
            <i class="fas fa-bolt stat-icon"></i>
            <span class="stat-value">5 мин</span>
            <span class="stat-label">Доставка</span>
          </div>
        </div>

        <!-- Футер -->
        <div class="shop-footer">
          <p>
            <i class="far fa-copyright" style="margin-right: 5px;"></i>
            2026 IYHANSHOP - Официальный магазин танков
          </p>
          <div class="footer-links">
            <a href="#">
              <i class="fas fa-info-circle" style="margin-right: 5px;"></i>
              О нас
            </a>
            <a href="#">
              <i class="fas fa-envelope" style="margin-right: 5px;"></i>
              Контакты
            </a>
            <a href="#">
              <i class="fas fa-truck" style="margin-right: 5px;"></i>
              Доставка
            </a>
            <a href="#">
              <i class="fas fa-shield-alt" style="margin-right: 5px;"></i>
              Гарантии
            </a>
          </div>
        </div>
      </div>
    `;

    setupEventListeners();
    startSimpleTimer();

  } catch {
    router.navigateTo('/');
  }
}

function setupEventListeners() {
  document.getElementById('catalog-btn')?.addEventListener('click', () => {
    router.navigateTo('/catalog');
  });

  document.getElementById('cart-btn')?.addEventListener('click', () => {
    router.navigateTo('/cart');
  });

  document.getElementById('logout-btn')?.addEventListener('click', async () => {
    await api.logout();
    router.navigateTo('/');
  });

  document.getElementById('view-all-tanks')?.addEventListener('click', () => {
    router.navigateTo('/catalog');
  });

  document.getElementById('profile-btn')?.addEventListener('click', () => {
    router.navigateTo('/profile');
  });

  document.getElementById('promo-simple-btn')?.addEventListener('click', () => {
    router.navigateTo('/catalog');
  });

  document.querySelectorAll('.tank-buy-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const target = e.currentTarget as HTMLElement;
      const tankId = parseInt(target.getAttribute('data-tank-id') || '0');
      const tankName = target.getAttribute('data-tank-name') || 'Танк';
      
      target.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Добавление...';
      (target as HTMLButtonElement).disabled = true;
      
      try {
        await apiCart.addToCart(tankId, 1);

        target.innerHTML = '<i class="fas fa-check"></i> Добавлено!';
        target.classList.add('success');
        
        showNotification(`${tankName} добавлен в корзину!`);
        
        setTimeout(() => {
          target.innerHTML = '<i class="fas fa-shopping-cart" style="margin-right: 5px;"></i> Купить';
          target.classList.remove('success');
          (target as HTMLButtonElement).disabled = false;
        }, 2000);
        
      } catch (err) {
        console.error(err);
        target.innerHTML = '<i class="fas fa-shopping-cart" style="margin-right: 5px;"></i> Купить';
        (target as HTMLButtonElement).disabled = false;
        alert('Ошибка при добавлении в корзину. Попробуйте ещё раз.');
      }
    });
  });
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

function startSimpleTimer(): void {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  
  let timerInterval: ReturnType<typeof setInterval> | undefined;
  
  function update(): void {
    const hoursEl = document.getElementById('simple-hours');
    const minutesEl = document.getElementById('simple-minutes');
    const secondsEl = document.getElementById('simple-seconds');
    
    if (!hoursEl || !minutesEl || !secondsEl) {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
      return;
    }
    
    const diff = end.getTime() - Date.now();
    
    if (diff <= 0) {
      hoursEl.textContent = '00';
      minutesEl.textContent = '00';
      secondsEl.textContent = '00';
      if (timerInterval) {
        clearInterval(timerInterval);
      }
      return;
    }
    
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    hoursEl.textContent = hours.toString().padStart(2, '0');
    minutesEl.textContent = minutes.toString().padStart(2, '0');
    secondsEl.textContent = seconds.toString().padStart(2, '0');
  }
  
  update();
  timerInterval = setInterval(update, 1000);
}