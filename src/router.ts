type PageFunction = () => void | Promise<void>;

export class Router {
  private routes: Map<string, PageFunction> = new Map();
  private localeCheckDone = false;
  
  constructor() {
    window.addEventListener('popstate', () => this.handleRoute());
  }
  
  addRoute(path: string, handler: PageFunction) {
    this.routes.set(path, handler);
  }
  
  navigateTo(path: string) {
    window.history.pushState({}, '', path);
    this.handleRoute();
  }
  
  private async handleRoute() {
    const path = window.location.pathname;
    const handler = this.routes.get(path) || this.routes.get('/');
    if (handler) {
      await handler();
    }
  }
  
  async start() {
    await ensureLocale();
    this.handleRoute();
  }
}

async function ensureLocale() {
  try {
    const res = await fetch('/api/locale');
    const data = await res.json();
    if (data.lang) {
      await loadLocale(data.lang);
    }
    if (!data.lang) {
      await showLocalePopup();
    }
  } catch {
    await loadLocale('ru');
  }
}

async function showLocalePopup() {
  return new Promise<void>((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'locale-overlay';
    overlay.innerHTML = `
      <div class="locale-popup">
        <div class="locale-popup-icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg></div>
        <h3 class="locale-popup-title">Выберите язык / Choose language</h3>
        <p class="locale-popup-text">Русский &nbsp;·&nbsp; English</p>
        <div class="locale-popup-buttons">
          <button class="wot-btn wot-btn-primary" id="locale-ru">Русский</button>
          <button class="wot-btn" id="locale-en">English</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    document.getElementById('locale-ru')?.addEventListener('click', async () => {
      await setLocale('ru');
      overlay.remove();
      resolve();
    });

    document.getElementById('locale-en')?.addEventListener('click', async () => {
      await setLocale('en');
      overlay.remove();
      resolve();
    });
  });
}

export const router = new Router();

import { renderHomePage } from './pages/HomePage.js';
import { renderLoginPage } from './pages/LoginPage.js';
import { renderRegisterPage } from './pages/RegisterPage.js';
import { renderMainPage } from './pages/MainPage.js';
import { renderProfilePage } from './pages/ProfilePage.js';

import { renderCatalogPage } from './pages/CatalogPage_catalog.js';
import { renderCartPage } from './pages/CartPage_cart.js';
import { renderDeliveryPage } from './pages/DeliveryPage_delivery.js';
import { renderAdminPage } from './pages/AdminPage.js';
import { loadLocale, setLocale, t } from './services/locale.js';

router.addRoute('/', renderHomePage);
router.addRoute('/admin', renderAdminPage);
router.addRoute('/login', renderLoginPage);
router.addRoute('/register', renderRegisterPage);
router.addRoute('/main', renderMainPage);
router.addRoute('/profile', renderProfilePage);
router.addRoute('/catalog', renderCatalogPage);
router.addRoute('/cart', renderCartPage);
router.addRoute('/delivery', renderDeliveryPage);
