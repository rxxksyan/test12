type PageFunction = () => void | Promise<void>;

export class Router {
  private routes: Map<string, PageFunction> = new Map();
  
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
  
  start() {
    this.handleRoute();
  }
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

router.addRoute('/', renderHomePage);
router.addRoute('/login', renderLoginPage);
router.addRoute('/register', renderRegisterPage);
router.addRoute('/main', renderMainPage);
router.addRoute('/profile', renderProfilePage);
router.addRoute('/catalog', renderCatalogPage);
router.addRoute('/cart', renderCartPage);
router.addRoute('/delivery', renderDeliveryPage);