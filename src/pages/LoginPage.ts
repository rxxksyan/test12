import { api } from '../services/api.js';
import { router } from '../main.js';
import { AuthResponse } from '../types/index.js';
import { t } from '../services/locale.js';

export function renderLoginPage() {
  const app = document.getElementById('app');
  if (!app) return;

  app.innerHTML = `
    <div class="auth-page login-page">
      <div class="auth-card">
        <div class="auth-header">
          <h2>${t('app.title')}</h2>
          <p>${t('auth.login.title')}</p>
        </div>
        <form id="login-form">
          <div class="wot-input-group">
            <label class="wot-label">
              <i class="fas fa-envelope"></i>
              ${t('form.email')}
            </label>
            <input type="email" class="wot-input" id="email" placeholder="${t('form.placeholder.email')}" required>
          </div>
          <div class="wot-input-group">
            <label class="wot-label">
              <i class="fas fa-lock"></i>
              ${t('form.password')}
            </label>
            <input type="password" class="wot-input" id="password" placeholder="••••••••" required>
          </div>
          <div class="auth-options">
            <label class="remember-me">
              <input type="checkbox"> ${t('auth.login.remember')}
            </label>
            <a href="#" class="forgot-password">${t('auth.login.forgot')}</a>
          </div>
          <button type="submit" class="auth-btn">
            <i class="fas fa-sign-in-alt"></i> ${t('auth.login.btn')}
          </button>
          <div class="auth-link">
            ${t('auth.login.noAccount')} <a href="#" id="register-link">${t('auth.login.register')}</a>
          </div>
          <button type="button" class="back-btn" id="back-btn">
            <i class="fas fa-arrow-left"></i> ${t('nav.back')}
          </button>
        </form>
      </div>
    </div>
  `;

  const form = document.getElementById('login-form') as HTMLFormElement;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = (document.getElementById('email') as HTMLInputElement).value;
    const password = (document.getElementById('password') as HTMLInputElement).value;

    try {
      const response: AuthResponse = await api.login(email, password);
      console.log('Login successful:', response.user);
      router.navigateTo('/main');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Ошибка входа');
    }
  });

  document.getElementById('register-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    router.navigateTo('/register');
  });

  document.getElementById('back-btn')?.addEventListener('click', () => {
    router.navigateTo('/');
  });
}
