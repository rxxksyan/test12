import { router } from '../main.js';
import { api } from '../services/api.js';
import { AuthResponse } from '../types/index.js';

export async function renderHomePage() {
  const app = document.getElementById('app');
  if (!app) return;

  // убрать позже проверку на авторизацию т.к. эта страница не будет показываться для авторизованных юзеров

  try {
    const response: AuthResponse = await api.getMe();
    const user = response.user;
    
    if (user) {
      app.innerHTML = `
        <div class="wot-container">
          <h1>Добро пожаловать, ${user.nickname}!</h1>
          <button class="wot-btn-primary" id="catalog-btn">Каталог танков</button>
          <button class="wot-btn" id="logout-btn">Выйти</button>
        </div>
      `;
      
      document.getElementById('catalog-btn')?.addEventListener('click', () => {
        alert('Страница каталога в разработке');
      });
      
      document.getElementById('logout-btn')?.addEventListener('click', async () => {
        await api.logout();
        router.navigateTo('/');
      });
    } else {
      renderNotAuth(app);
    }
  } catch {
    renderNotAuth(app);
  }
}

function renderNotAuth(app: HTMLElement) {
  app.innerHTML = `
    <div class="home-page">

      <!-- Hero секция -->
      <div class="hero-section">
        <div class="hero-pattern"></div>
        
        <div class="hero-container">
          <div class="hero-content">
            <h1 class="hero-title">
              IYHAN<span class="accent">SHOP</span>
            </h1>
            <p class="hero-subtitle">
              Легендарная боевая техника для настоящих командиров
            </p>
            <div class="hero-buttons">
              <button class="wot-btn wot-btn-primary" id="register-btn">
                <i class="fas fa-user-plus"></i> Начать сейчас
              </button>
              <button class="wot-btn wot-btn-secondary" id="learn-more-btn">
                <i class="fas fa-info-circle"></i> Узнать больше
              </button>
            </div>
            
            <!-- Метрики -->
            <div class="hero-metrics">
              <div class="hero-metric">
                <span class="hero-metric-value" id="metric-users">0</span>
                <span class="hero-metric-label">командиров онлайн</span>
              </div>
              <div class="hero-metric">
                <span class="hero-metric-value" id="metric-tanks">0</span>
                <span class="hero-metric-label">танков в наличии</span>
              </div>
              <div class="hero-metric">
                <span class="hero-metric-value" id="metric-rating">0.0</span>
                <span class="hero-metric-label">рейтинг</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Индикатор скролла -->
        <div class="scroll-indicator">
          <span class="scroll-text">Листайте вниз</span>
          <div class="scroll-arrow">
            <i class="fas fa-chevron-down"></i>
            <i class="fas fa-chevron-down"></i>
            <i class="fas fa-chevron-down"></i>
          </div>
        </div>
      </div>

      <div class="wot-container">
        <!-- Преимущества (как в MainPage) -->
        <div class="advantages-section">
          <h2 class="section-title">Почему выбирают IYHANSHOP</h2>
          <div class="advantages-grid">
            <div class="advantage-card">
              <div class="advantage-icon">
                <i class="fas fa-bolt"></i>
              </div>
              <h3 class="advantage-title">Быстрая доставка</h3>
              <p class="advantage-desc">Танк в ангаре через 5 минут после покупки</p>
            </div>
            <div class="advantage-card">
              <div class="advantage-icon">
                <i class="fas fa-shield-alt"></i>
              </div>
              <h3 class="advantage-title">Гарантия качества</h3>
              <p class="advantage-desc">Все заказы с гарантией выполнения</p>
            </div>
            <div class="advantage-card">
              <div class="advantage-icon">
                <i class="fas fa-tag"></i>
              </div>
              <h3 class="advantage-title">Лучшие цены</h3>
              <p class="advantage-desc">На 20% дешевле чем в премиум магазине</p>
            </div>
            <div class="advantage-card">
              <div class="advantage-icon">
                <i class="fas fa-headset"></i>
              </div>
              <h3 class="advantage-title">Поддержка 24/7</h3>
              <p class="advantage-desc">Мы всегда на связи, чтобы подобрать лучшую технику</p>
            </div>
          </div>
        </div>

        <!-- Анимированный счётчик -->
        <div class="counter-section animate-on-scroll" id="counter-section">
          <div class="counter-title">Уже выбрали качество</div>
          <div class="counter-number" id="counter">0</div>
          <div class="counter-label">довольных командиров</div>
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

        <!-- Отзывы командиров -->
        <div class="reviews-section animate-on-scroll">
          <h2 class="section-title">
            <i class="fas fa-comments" style="color: #ff7800;"></i> Что говорят командиры
          </h2>
          <div class="reviews-grid">
            <div class="review-card">
              <div class="review-header">
                <div class="review-avatar">A</div>
                <div>
                  <div class="review-author">Alexey_Pro</div>
                  <div class="review-date">15.02.2026</div>
                </div>
              </div>
              <div class="review-rating">★★★★★</div>
              <p class="review-text">"Купил IS-7, доставили за 3 минуты! Очень доволен, магазин лучший."</p>
              <div class="review-tank">Приобрёл: IS-7</div>
            </div>
            <div class="review-card">
              <div class="review-header">
                <div class="review-avatar">M</div>
                <div>
                  <div class="review-author">Mixa_Tankist</div>
                  <div class="review-date">10.02.2026</div>
                </div>
              </div>
              <div class="review-rating">★★★★☆</div>
              <p class="review-text">"Большой выбор техники, цены приятные. Поддержка отвечает быстро."</p>
              <div class="review-tank">Приобрёл: Leopard 1</div>
            </div>
            <div class="review-card">
              <div class="review-header">
                <div class="review-avatar">D</div>
                <div>
                  <div class="review-author">Dimon_666</div>
                  <div class="review-date">05.02.2026</div>
                </div>
              </div>
              <div class="review-rating">★★★★★</div>
              <p class="review-text">"Отличный сервис, уже третий танк беру. Всем советую!"</p>
              <div class="review-tank">Приобрёл: E 100</div>
            </div>
          </div>
        </div>

        <!-- CTA секция -->
        <div class="cta-section">
          <h2 class="cta-title">Готов к бою?</h2>
          <p class="cta-text">Присоединяйся к тысячам командиров, которые уже выбрали IYHAN SHOP</p>
          <div class="cta-buttons">
            <button class="wot-btn wot-btn-primary" id="cta-register-btn">Зарегистрироваться</button>
            <button class="wot-btn" id="cta-login-btn">Войти</button>
          </div>
        </div>

        <!-- Футер -->
        <div class="shop-footer">
          <p>
            <i class="far fa-copyright" style="margin-right: 5px;"></i>
            2026 IYHANSHOP - Магазин танков от командира для командиров
          </p>
          <div class="footer-links">
            <a href="#"><i class="fas fa-info-circle"></i> О нас</a>
            <a href="#"><i class="fas fa-envelope"></i> Контакты</a>
            <a href="#"><i class="fas fa-truck"></i> Доставка</a>
            <a href="#"><i class="fas fa-shield-alt"></i> Гарантии</a>
          </div>
        </div>
      </div>
    </div>
  `;

  const registerBtns = document.querySelectorAll('#register-btn, #cta-register-btn');
  registerBtns.forEach(btn => {
    btn.addEventListener('click', () => router.navigateTo('/register'));
  });

  const loginBtns = document.querySelectorAll('#login-btn, #cta-login-btn');
  loginBtns.forEach(btn => {
    btn.addEventListener('click', () => router.navigateTo('/login'));
  });

  document.getElementById('tank-week-btn')?.addEventListener('click', () => {
    router.navigateTo('/register');
  });

  function animateCounter() {
    const counterElement = document.getElementById('counter');
    if (!counterElement) return;
    
    const target = 9110;
    let current = 0;
    const increment = target / 100;
    const updateCounter = () => {
      current += increment;
      if (current < target) {
        counterElement.textContent = Math.floor(current).toLocaleString();
        requestAnimationFrame(updateCounter);
      } else {
        counterElement.textContent = target.toLocaleString() + '+';
      }
    };
    updateCounter();
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        if (entry.target.id === 'counter-section') {
          animateCounter();
        }
      }
    });
  }, { threshold: 0.3 });

  document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));

  document.getElementById('learn-more-btn')?.addEventListener('click', () => {
    document.querySelector('.advantages-section')?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    });
  });

  function animateMetrics() {
    const usersEl = document.getElementById('metric-users');
    const tanksEl = document.getElementById('metric-tanks');
    const ratingEl = document.getElementById('metric-rating');
    
    if (!usersEl || !tanksEl || !ratingEl) return;
    
    const targetUsers = 1540;
    const targetTanks = 86;
    const targetRating = 4.9;
    
    let currentUsers = 0, currentTanks = 0, currentRating = 0;
    const step = () => {
      let active = false;
      if (currentUsers < targetUsers) {
        currentUsers += Math.ceil(targetUsers / 80);
        if (currentUsers > targetUsers) currentUsers = targetUsers;
        usersEl.textContent = currentUsers.toLocaleString();
        active = true;
      }
      if (currentTanks < targetTanks) {
        currentTanks += Math.ceil(targetTanks / 40);
        if (currentTanks > targetTanks) currentTanks = targetTanks;
        tanksEl.textContent = currentTanks.toLocaleString();
        active = true;
      }
      if (currentRating < targetRating) {
        currentRating = Math.min(currentRating + 0.1, targetRating);
        ratingEl.textContent = currentRating.toFixed(1);
        active = true;
      }
      if (active) {
        requestAnimationFrame(step);
      }
    };
    step();
  }

  const observerMetrics = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateMetrics();
        observerMetrics.disconnect();
      }
    });
  }, { threshold: 0.3 });

  const heroSection = document.querySelector('.hero-section');
  if (heroSection) observerMetrics.observe(heroSection);
}