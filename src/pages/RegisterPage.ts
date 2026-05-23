import { api } from '../services/api.js';
import { router } from '../main.js';
import { AuthResponse } from '../types/index.js';
import { t } from '../services/locale.js';

function showNotification(message: string, isError: boolean = true) {
  const existing = document.querySelector('.custom-notification');
  if (existing) existing.remove();

  const notification = document.createElement('div');
  notification.className = `custom-notification ${isError ? 'error' : 'success'}`;
  notification.innerHTML = `
    <i class="fas ${isError ? 'fa-exclamation-circle' : 'fa-check-circle'}"></i>
    <span>${message}</span>
  `;
  document.body.appendChild(notification);

  setTimeout(() => notification.classList.add('show'), 10);

  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

export function renderRegisterPage() {
  const app = document.getElementById('app');
  if (!app) return;

  app.innerHTML = `
    <div class="auth-page register-page">
      <div class="auth-card">
        <div class="auth-header">
          <h2>${t('app.title')}</h2>
          <p>${t('auth.register.title')}</p>
        </div>
        <form id="register-form" data-registration>
          <div class="wot-input-group">
            <label class="wot-label">
              <i class="fas fa-user"></i>
              ${t('form.nickname')}
            </label>
            <input type="text" class="wot-input" id="nickname" placeholder="${t('form.placeholder.nickname')}" required>
          </div>
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
            <input type="password" class="wot-input" id="password" placeholder="${t('form.placeholder.password')}" required minlength="6">
          </div>
          <div class="wot-input-group">
            <label class="wot-label">
              <i class="fas fa-lock"></i>
              ${t('form.confirmPassword')}
            </label>
            <input type="password" class="wot-input" id="confirm-password" placeholder="${t('form.placeholder.password')}" required minlength="6">
            <div class="password-hint" id="password-match-hint">
              <i class="fas fa-check-circle"></i> ${t('auth.register.passwordMatch')}
            </div>
          </div>
          <div class="terms">
            <input type="checkbox" id="terms" required>
            <label for="terms">${t('auth.register.terms')}</label>
          </div>
          <button type="submit" class="auth-btn" id="submit-btn">
            <i class="fas fa-user-plus"></i> ${t('auth.register.btn')}
          </button>
          <div class="auth-link">
            <div style="text-align: center; width: 100%;">
              ${t('auth.register.hasAccount')} <a href="#" id="login-link">${t('auth.register.login')}</a>
            </div>
          </div>
          <button type="button" class="back-btn" id="back-btn">
            <i class="fas fa-arrow-left"></i> ${t('nav.back')}
          </button>
        </form>
      </div>
    </div>
  `;

  const passwordInput = document.getElementById('password') as HTMLInputElement;
  const confirmInput = document.getElementById('confirm-password') as HTMLInputElement;
  const matchHint = document.getElementById('password-match-hint') as HTMLElement;
  const submitBtn = document.getElementById('submit-btn') as HTMLButtonElement;

  function checkPasswordMatch() {
    if (!confirmInput.value) {
      matchHint.classList.remove('show');
      return;
    }
    
    if (passwordInput.value === confirmInput.value) {
      matchHint.classList.add('show');
      matchHint.innerHTML = `<i class="fas fa-check-circle"></i> ${t('auth.register.passwordMatch')}`;
    } else {
      matchHint.classList.add('show');
      matchHint.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${t('auth.register.passwordNoMatch')}`;
    }
  }

  passwordInput.addEventListener('input', checkPasswordMatch);
  confirmInput.addEventListener('input', checkPasswordMatch);

  const form = document.getElementById('register-form') as HTMLFormElement;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const nickname = (document.getElementById('nickname') as HTMLInputElement).value.trim();
    const email = (document.getElementById('email') as HTMLInputElement).value.trim();
    const password = (document.getElementById('password') as HTMLInputElement).value;
    const confirmPassword = (document.getElementById('confirm-password') as HTMLInputElement).value;
    const terms = (document.getElementById('terms') as HTMLInputElement).checked;

    if (!nickname || !email || !password || !confirmPassword) {
      showNotification('Пожалуйста, заполните все поля');
      return;
    }

    if (password !== confirmPassword) {
      showNotification('Пароли не совпадают');
      return;
    }

    if (password.length < 6) {
      showNotification('Пароль должен содержать минимум 6 символов');
      return;
    }

    if (!terms) {
      showNotification('Необходимо принять условия использования');
      return;
    }

    try {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Регистрация...';
      
      const response: AuthResponse = await api.register(nickname, email, password);
      console.log('Registration successful:', response.user);
      
      showNotification('Регистрация успешна! Перенаправляем...', false);
      
      setTimeout(() => {
        router.navigateTo('/login');
      }, 1500);
      
    } catch (err: unknown) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<i class="fas fa-user-plus"></i> ${t('auth.register.btn')}`;
      
      let errorMessage = err instanceof Error ? err.message : 'Ошибка при регистрации';
      
      if (errorMessage.includes('email already exists')) {
        errorMessage = 'Пользователь с таким email уже существует';
      } else if (errorMessage.includes('nickname already exists')) {
        errorMessage = 'Пользователь с таким ником уже существует';
      }
      
      showNotification(errorMessage);
    }
  });

  document.getElementById('login-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    router.navigateTo('/login');
  });

  document.getElementById('back-btn')?.addEventListener('click', () => {
    router.navigateTo('/');
  });
}
