import { api } from '../services/api.js';
import { router } from '../main.js';
import { AuthResponse } from '../types/index.js';

export function renderLoginPage() {
  const app = document.getElementById('app');
  if (!app) return;

  app.innerHTML = `
    <div class="auth-page login-page">
      <div class="auth-card">
        <div class="auth-header">
          <h2>IYHAN SHOP</h2>
          <p>Вход в аккаунт</p>
        </div>
        <form id="login-form">
          <div class="wot-input-group">
            <label class="wot-label">
              <i class="fas fa-envelope"></i>
              Email
            </label>
            <input type="email" class="wot-input" id="email" placeholder="your@email.com" required>
          </div>
          <div class="wot-input-group">
            <label class="wot-label">
              <i class="fas fa-lock"></i>
              Пароль
            </label>
            <input type="password" class="wot-input" id="password" placeholder="••••••••" required>
          </div>
          <div class="auth-options">
            <label class="remember-me">
              <input type="checkbox"> Запомнить меня
            </label>
            <a href="#" class="forgot-password">Забыли пароль?</a>
          </div>
          <button type="submit" class="auth-btn">
            <i class="fas fa-sign-in-alt"></i> Войти
          </button>
          <div class="auth-link">
            Нет аккаунта? <a href="#" id="register-link">Зарегистрироваться</a>
          </div>
          <button type="button" class="back-btn" id="back-btn">
            <i class="fas fa-arrow-left"></i> На главную
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
    } catch (err: any) {
      alert(err.message);
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