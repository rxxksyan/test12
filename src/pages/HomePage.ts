import { router } from '../main.js';
import { api } from '../services/api.js';
import { AuthResponse } from '../types/index.js';
import { t } from '../services/locale.js';

export async function renderHomePage() {
  const app = document.getElementById('app');
  if (!app) return;

  try {
    const response: AuthResponse = await api.getMe();
    const user = response.user;
    
    if (user) {
      app.innerHTML = `
        <div class="wot-container">
          <h1>${t('home.welcome')}, ${user.nickname}!</h1>
          <button class="wot-btn-primary" id="catalog-btn">${t('nav.catalog')}</button>
          <button class="wot-btn" id="logout-btn">${t('nav.logout')}</button>
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

      <div class="hero-section">
        <div class="hero-pattern"></div>
        
        <div class="hero-container">
          <div class="hero-content">
            <h1 class="hero-title">
              ${t('hero.title')}<span class="accent">${t('hero.titleAccent')}</span>
            </h1>
            <p class="hero-subtitle">
              ${t('hero.subtitle')}
            </p>
            <div class="hero-buttons">
              <button class="wot-btn wot-btn-primary" id="register-btn">
                <i class="fas fa-user-plus"></i> ${t('hero.start')}
              </button>
              <button class="wot-btn wot-btn-secondary" id="learn-more-btn">
                <i class="fas fa-info-circle"></i> ${t('hero.learnMore')}
              </button>
            </div>
            
            <div class="hero-metrics">
              <div class="hero-metric">
                <span class="hero-metric-value" id="metric-users">0</span>
                <span class="hero-metric-label">${t('hero.metricUsers')}</span>
              </div>
              <div class="hero-metric">
                <span class="hero-metric-value" id="metric-tanks">0</span>
                <span class="hero-metric-label">${t('hero.metricTanks')}</span>
              </div>
              <div class="hero-metric">
                <span class="hero-metric-value" id="metric-rating">0.0</span>
                <span class="hero-metric-label">${t('hero.metricRating')}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="scroll-indicator">
          <span class="scroll-text">${t('hero.scrollDown')}</span>
          <div class="scroll-arrow">
            <i class="fas fa-chevron-down"></i>
            <i class="fas fa-chevron-down"></i>
            <i class="fas fa-chevron-down"></i>
          </div>
        </div>
      </div>

      <div class="wot-container">
        <div class="advantages-section">
          <h2 class="section-title">${t('home.whyUs')}</h2>
          <div class="advantages-grid">
            <div class="advantage-card">
              <div class="advantage-icon">
                <i class="fas fa-bolt"></i>
              </div>
              <h3 class="advantage-title">${t('home.advantage1.title')}</h3>
              <p class="advantage-desc">${t('home.advantage1.desc')}</p>
            </div>
            <div class="advantage-card">
              <div class="advantage-icon">
                <i class="fas fa-shield-alt"></i>
              </div>
              <h3 class="advantage-title">${t('home.advantage2.title')}</h3>
              <p class="advantage-desc">${t('home.advantage2.desc')}</p>
            </div>
            <div class="advantage-card">
              <div class="advantage-icon">
                <i class="fas fa-tag"></i>
              </div>
              <h3 class="advantage-title">${t('home.advantage3.title')}</h3>
              <p class="advantage-desc">${t('home.advantage3.desc')}</p>
            </div>
            <div class="advantage-card">
              <div class="advantage-icon">
                <i class="fas fa-headset"></i>
              </div>
              <h3 class="advantage-title">${t('home.advantage4.title')}</h3>
              <p class="advantage-desc">${t('home.advantage4.desc')}</p>
            </div>
          </div>
        </div>

        <div class="counter-section animate-on-scroll" id="counter-section">
          <div class="counter-title">${t('home.counter')}</div>
          <div class="counter-number" id="counter">0</div>
          <div class="counter-label">${t('home.counterLabel')}</div>
        </div>

        <div class="stats-bar">
          <div class="stat-item">
            <i class="fas fa-tachometer-alt stat-icon"></i>
            <span class="stat-value">1500+</span>
            <span class="stat-label">${t('home.statsSold')}</span>
          </div>
          <div class="stat-item">
            <i class="fas fa-star stat-icon"></i>
            <span class="stat-value">98%</span>
            <span class="stat-label">${t('home.statsClients')}</span>
          </div>
          <div class="stat-item">
            <i class="fas fa-headset stat-icon"></i>
            <span class="stat-value">24/7</span>
            <span class="stat-label">${t('home.statsSupport')}</span>
          </div>
          <div class="stat-item">
            <i class="fas fa-bolt stat-icon"></i>
            <span class="stat-value">5 мин</span>
            <span class="stat-label">${t('home.statsDelivery')}</span>
          </div>
        </div>

        <div class="reviews-section animate-on-scroll">
          <h2 class="section-title">
            <i class="fas fa-comments" style="color: #ff7800;"></i> ${t('home.reviewsTitle')}
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

        <div class="cta-section">
          <h2 class="cta-title">${t('home.ctaTitle')}</h2>
          <p class="cta-text">${t('home.ctaText')}</p>
          <div class="cta-buttons">
            <button class="wot-btn wot-btn-primary" id="cta-register-btn">${t('home.register')}</button>
            <button class="wot-btn" id="cta-login-btn">${t('home.login')}</button>
          </div>
        </div>

        <div class="shop-footer">
          <p>
            <i class="far fa-copyright" style="margin-right: 5px;"></i>
            2026 IYHANSHOP - ${t('home.footer')}
          </p>
          <div class="footer-links">
            <a href="#"><i class="fas fa-info-circle"></i> ${t('home.about')}</a>
            <a href="#"><i class="fas fa-envelope"></i> ${t('home.contacts')}</a>
            <a href="#"><i class="fas fa-truck"></i> ${t('home.delivery')}</a>
            <a href="#"><i class="fas fa-shield-alt"></i> ${t('home.guarantees')}</a>
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
