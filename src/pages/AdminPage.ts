import { api } from '../services/api.js';
import { router } from '../main.js';
import { Product } from '../types/index_catalog.js';
import { t } from '../services/locale.js';

let allProducts: Product[] = [];

export async function renderAdminPage() {
  const app = document.getElementById('app');
  if (!app) return;

  try {
    const me = await api.getMe();
    if (!me.user || (me.user.role !== 'admin' && me.user.role !== 'owner')) {
      router.navigateTo('/main');
      return;
    }

    const res = await fetch('/api/catalog');
    const data = await res.json();
    allProducts = data.products || [];

    app.innerHTML = `
      <div class="wot-container">
        <div class="admin-header">
          <div class="header-left">
            <h1 class="shop-title">IYHAN<span class="accent">SHOP</span> / <span class="admin-title">${t('admin.title')}</span></h1>
          </div>
          <div class="header-right">
            <button class="wot-btn" id="admin-main-btn">
              <i class="fas fa-home btn-icon"></i>
              ${t('nav.home')}
            </button>
            <button class="wot-btn" id="admin-catalog-btn">
              <i class="fas fa-store btn-icon"></i>
              ${t('nav.catalog')}
            </button>
            <button class="wot-btn" id="admin-logout-btn">
              <i class="fas fa-sign-out-alt btn-icon"></i>
              ${t('nav.logout')}
            </button>
          </div>
        </div>

        <div class="admin-section">
          <h2 class="section-title">
            <i class="fas fa-plus-circle" style="color: #ff7800;"></i>
            ${t('admin.addProduct')}
          </h2>
          <form id="admin-add-form" class="admin-form">
            <div class="admin-form-row">
              <div class="form-group">
                <label>${t('admin.name')} *</label>
                <input type="text" id="af-name" class="wot-input" required>
              </div>
              <div class="form-group">
                <label>${t('admin.price')} *</label>
                <input type="number" id="af-price" class="wot-input" required>
              </div>
            </div>
            <div class="admin-form-row">
              <div class="form-group">
                <label>${t('admin.nation')}</label>
                <select id="af-nation" class="wot-select">
                  <option value="ussr">${t('nation.ussr')}</option>
                  <option value="germany">${t('nation.germany')}</option>
                  <option value="usa">${t('nation.usa')}</option>
                  <option value="france">${t('nation.france')}</option>
                  <option value="uk">${t('nation.uk')}</option>
                  <option value="china">${t('nation.china')}</option>
                  <option value="japan">${t('nation.japan')}</option>
                  <option value="czech">${t('nation.czech')}</option>
                  <option value="sweden">${t('nation.sweden')}</option>
                  <option value="italy">${t('nation.italy')}</option>
                  <option value="other">${t('nation.other')}</option>
                </select>
              </div>
              <div class="form-group">
                <label>${t('admin.type')}</label>
                <select id="af-type" class="wot-select">
                  <option value="heavy">${t('type.heavy')}</option>
                  <option value="medium">${t('type.medium')}</option>
                  <option value="light">${t('type.light')}</option>
                  <option value="at">${t('type.at')}</option>
                </select>
              </div>
              <div class="form-group">
                <label>${t('admin.level')}</label>
                <input type="number" id="af-level" class="wot-input" value="8">
              </div>
            </div>
            <div class="admin-form-row">
              <div class="form-group">
                <label>HP</label>
                <input type="text" id="af-hp" class="wot-input" placeholder="1 500">
              </div>
              <div class="form-group">
                <label>DMG</label>
                <input type="text" id="af-dmg" class="wot-input" placeholder="320">
              </div>
              <div class="form-group">
                <label>DPM</label>
                <input type="text" id="af-dpm" class="wot-input" placeholder="2 000">
              </div>
              <div class="form-group">
                <label>ACC</label>
                <input type="text" id="af-ptrs" class="wot-input" placeholder="0.35">
              </div>
              <div class="form-group">
                <label>TRAV</label>
                <input type="text" id="af-ptrp" class="wot-input" placeholder="30">
              </div>
              <div class="form-group">
                <label>SPD</label>
                <input type="text" id="af-spw" class="wot-input" placeholder="40">
              </div>
            </div>
            <div class="admin-form-row">
              <div class="form-group file-upload-group">
                <label>${t('admin.tankPhoto')}</label>
                <label class="custom-file-upload">
                  <input type="file" id="af-img" accept="image/png,image/jpeg,image/webp,image/gif">
                  <i class="fas fa-camera"></i>
                  <span id="af-img-label">${t('admin.chooseFile')}</span>
                </label>
              </div>
              <div class="form-group checkbox-inline">
                <label class="checkbox-label">
                  <input type="checkbox" id="af-instock" checked>
                  <span>${t('admin.inStock')}</span>
                </label>
              </div>
            </div>
            <div class="form-group">
              <label>${t('admin.description')}</label>
              <textarea id="af-desc" class="wot-input" rows="2"></textarea>
            </div>
            <button type="submit" class="wot-btn wot-btn-primary" style="margin-top: 15px;">
              <i class="fas fa-plus"></i> ${t('admin.addProduct')}
            </button>
          </form>
        </div>

        <div class="admin-section">
          <h2 class="section-title">
            <i class="fas fa-list"></i>
            ${t('nav.catalog')}
          </h2>
          <div class="admin-table-wrapper">
            <table class="wot-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>${t('admin.name')}</th>
                  <th>${t('admin.nation')}</th>
                  <th>${t('admin.type')}</th>
                  <th>${t('admin.level')}</th>
                  <th>${t('admin.price')}</th>
                  <th>${t('admin.actions')}</th>
                </tr>
              </thead>
              <tbody id="admin-products-tbody">
                ${allProducts.map(p => `
                  <tr>
                    <td>${p.id}</td>
                    <td>${p.name}</td>
                    <td>${p.nation}</td>
                    <td>${p.type}</td>
                    <td>${p.level}</td>
                    <td>${p.price.toLocaleString()}</td>
                    <td>
                      <button class="wot-btn wot-btn-primary admin-edit-btn" data-id="${p.id}" style="padding: 5px 10px; font-size: 0.8rem;">
                        <i class="fas fa-edit"></i>
                      </button>
                      <button class="wot-btn admin-delete-btn" data-id="${p.id}" style="padding: 5px 10px; font-size: 0.8rem; background: #d32f2f;">
                        <i class="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <div class="modal-overlay" id="admin-edit-modal" style="display: none;">
          <div class="modal-content" id="admin-edit-content"></div>
        </div>
      </div>
    `;

    setupAdminListeners();

  } catch {
    router.navigateTo('/main');
  }
}

function setupAdminListeners() {
  document.getElementById('admin-main-btn')?.addEventListener('click', () => router.navigateTo('/main'));

  document.getElementById('af-img')?.addEventListener('change', function() {
    const label = document.getElementById('af-img-label');
    const files = (this as HTMLInputElement).files;
    if (label && files && files[0]) {
      label.textContent = files[0].name;
    }
  });
  document.getElementById('admin-catalog-btn')?.addEventListener('click', () => router.navigateTo('/catalog'));
  document.getElementById('admin-logout-btn')?.addEventListener('click', async () => {
    await api.logout();
    router.navigateTo('/');
  });

  document.getElementById('admin-add-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const btn = form.querySelector('button[type="submit"]') as HTMLButtonElement;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

    const fd = new FormData();
    fd.append('name', (document.getElementById('af-name') as HTMLInputElement).value);
    fd.append('price', (document.getElementById('af-price') as HTMLInputElement).value);
    fd.append('nation', (document.getElementById('af-nation') as HTMLSelectElement).value);
    fd.append('type', (document.getElementById('af-type') as HTMLSelectElement).value);
    fd.append('level', (document.getElementById('af-level') as HTMLInputElement).value);
    fd.append('hp', (document.getElementById('af-hp') as HTMLInputElement).value || '0');
    fd.append('dmg', (document.getElementById('af-dmg') as HTMLInputElement).value || '0');
    fd.append('dpm', (document.getElementById('af-dpm') as HTMLInputElement).value || '0');
    fd.append('ptrs', (document.getElementById('af-ptrs') as HTMLInputElement).value || '0');
    fd.append('ptrp', (document.getElementById('af-ptrp') as HTMLInputElement).value || '0');
    fd.append('spw', (document.getElementById('af-spw') as HTMLInputElement).value || '0');
    fd.append('inStock', (document.getElementById('af-instock') as HTMLInputElement).checked ? 'true' : 'false');
    fd.append('description', (document.getElementById('af-desc') as HTMLTextAreaElement).value || '');
    const fileInput = document.getElementById('af-img') as HTMLInputElement;
    if (fileInput.files && fileInput.files[0]) {
      fd.append('image', fileInput.files[0]);
    }

    try {
      await fetch('/api/catalog', {
        method: 'POST',
        body: fd
      });
      renderAdminPage();
    } catch (err) {
      console.error(err);
      alert('Ошибка при создании товара');
      btn.disabled = false;
      btn.innerHTML = `<i class="fas fa-plus"></i> ${t('admin.addProduct')}`;
    }
  });

  document.querySelectorAll('.admin-edit-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = parseInt((e.currentTarget as HTMLElement).getAttribute('data-id') || '0');
      openEditModal(id);
    });
  });

  document.querySelectorAll('.admin-delete-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = parseInt((e.currentTarget as HTMLElement).getAttribute('data-id') || '0');
      if (!confirm(`Удалить товар #${id}?`)) return;

      try {
        await fetch(`/api/catalog/${id}`, { method: 'DELETE' });
        renderAdminPage();
      } catch (err) {
        console.error(err);
        alert('Ошибка при удалении');
      }
    });
  });
}

function openEditModal(id: number) {
  const product = allProducts.find(p => p.id === id);
  if (!product) return;

  const overlay = document.getElementById('admin-edit-modal');
  const content = document.getElementById('admin-edit-content');
  if (!overlay || !content) return;

  const hasImage = product.img && product.img.startsWith('images/');

  content.innerHTML = `
    <div class="admin-edit-form">
      <h3>${t('admin.editProduct')}: ${product.name}</h3>
      <form id="admin-edit-form-inner">
        <div class="admin-form-row">
          <div class="form-group">
            <label>${t('admin.name')}</label>
            <input type="text" id="ef-name" class="wot-input" value="${product.name}">
          </div>
          <div class="form-group">
            <label>${t('admin.price')}</label>
            <input type="number" id="ef-price" class="wot-input" value="${product.price}">
          </div>
        </div>
        <div class="admin-form-row">
          <div class="form-group">
            <label>${t('admin.nation')}</label>
            <select id="ef-nation" class="wot-select">
              ${['ussr','germany','usa','france','uk','china','japan','czech','sweden','italy','other'].map(n =>
                `<option value="${n}" ${product.nation === n ? 'selected' : ''}>${n}</option>`
              ).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>${t('admin.type')}</label>
            <select id="ef-type" class="wot-select">
              ${['heavy','medium','light','at'].map(tp =>
                `<option value="${tp}" ${product.type === tp ? 'selected' : ''}>${tp}</option>`
              ).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>${t('admin.level')}</label>
            <input type="number" id="ef-level" class="wot-input" value="${product.level}">
          </div>
        </div>
        <div class="admin-form-row">
          <div class="form-group">
            <label>HP</label>
            <input type="text" id="ef-hp" class="wot-input" value="${product.hp}">
          </div>
          <div class="form-group">
            <label>DMG</label>
            <input type="text" id="ef-dmg" class="wot-input" value="${product.dmg}">
          </div>
          <div class="form-group">
            <label>DPM</label>
            <input type="text" id="ef-dpm" class="wot-input" value="${product.dpm}">
          </div>
          <div class="form-group">
            <label>ACC</label>
            <input type="text" id="ef-ptrs" class="wot-input" value="${product.ptrs || ''}">
          </div>
          <div class="form-group">
            <label>TRAV</label>
            <input type="text" id="ef-ptrp" class="wot-input" value="${product.ptrp || ''}">
          </div>
          <div class="form-group">
            <label>SPD</label>
            <input type="text" id="ef-spw" class="wot-input" value="${product.spw || ''}">
          </div>
        </div>
        <div class="admin-form-row">
          <div class="form-group checkbox-inline" style="flex: 0 0 auto; min-width: auto;">
            <label class="checkbox-label">
              <input type="checkbox" id="ef-instock" ${product.inStock ? 'checked' : ''}>
              <span>${t('admin.inStock')}</span>
            </label>
          </div>
        </div>
        <div class="form-group">
          <label>${t('admin.description')}</label>
          <textarea id="ef-desc" class="wot-input" rows="2">${product.description || ''}</textarea>
        </div>
        <div class="form-group">
          <label>${t('admin.tankPhoto')}</label>
          <div class="edit-image-section">
            ${hasImage ? `
              <div class="edit-current-image">
                <img src="/${product.img}" alt="${product.name}" style="max-width:120px;max-height:80px;border-radius:4px;">
                <button type="button" class="wot-btn admin-del-image-btn" data-id="${product.id}" style="background:#d32f2f;padding:3px 8px;font-size:0.75rem;margin-top:4px;">
                  <i class="fas fa-trash"></i> ${t('admin.deletePhoto')}
                </button>
              </div>
            ` : `<p class="text-dim">${t('admin.noPhoto')}</p>`}
            <input type="file" id="ef-img" class="wot-input" accept="image/png,image/jpeg,image/webp,image/gif" style="margin-top:6px;">
          </div>
        </div>
        <div class="admin-form-actions">
          <button type="submit" class="wot-btn wot-btn-primary">
            <i class="fas fa-save"></i> ${t('admin.save')}
          </button>
          <button type="button" class="wot-btn" id="admin-edit-close">
            <i class="fas fa-times"></i> ${t('admin.cancel')}
          </button>
        </div>
      </form>
    </div>
  `;

  overlay.style.display = 'flex';

  document.getElementById('admin-edit-close')?.addEventListener('click', () => {
    overlay.style.display = 'none';
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.style.display = 'none';
  });

  document.getElementById('admin-edit-form-inner')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const fd = new FormData();
    fd.append('name', (document.getElementById('ef-name') as HTMLInputElement).value);
    fd.append('price', (document.getElementById('ef-price') as HTMLInputElement).value);
    fd.append('nation', (document.getElementById('ef-nation') as HTMLSelectElement).value);
    fd.append('type', (document.getElementById('ef-type') as HTMLSelectElement).value);
    fd.append('level', (document.getElementById('ef-level') as HTMLInputElement).value);
    fd.append('hp', (document.getElementById('ef-hp') as HTMLInputElement).value);
    fd.append('dmg', (document.getElementById('ef-dmg') as HTMLInputElement).value);
    fd.append('dpm', (document.getElementById('ef-dpm') as HTMLInputElement).value);
    fd.append('ptrs', (document.getElementById('ef-ptrs') as HTMLInputElement).value || '0');
    fd.append('ptrp', (document.getElementById('ef-ptrp') as HTMLInputElement).value || '0');
    fd.append('spw', (document.getElementById('ef-spw') as HTMLInputElement).value || '0');
    fd.append('inStock', (document.getElementById('ef-instock') as HTMLInputElement).checked ? 'true' : 'false');
    fd.append('description', (document.getElementById('ef-desc') as HTMLTextAreaElement).value || '');

    const fileInput = document.getElementById('ef-img') as HTMLInputElement;
    if (fileInput.files && fileInput.files[0]) {
      fd.append('image', fileInput.files[0]);
    }

    try {
      await fetch(`/api/catalog/${id}`, {
        method: 'PUT',
        body: fd
      });
      renderAdminPage();
    } catch (err) {
      console.error(err);
      alert('Ошибка при обновлении');
    }
  });

  document.querySelector('.admin-del-image-btn')?.addEventListener('click', async (e) => {
    const target = e.currentTarget as HTMLElement;
    const productId = target.getAttribute('data-id');
    if (!productId || !confirm(t('admin.confirmDeletePhoto'))) return;

    try {
      await fetch(`/api/catalog/${productId}/image`, { method: 'DELETE' });
      renderAdminPage();
    } catch (err) {
      console.error(err);
      alert('Ошибка при удалении фото');
    }
  });
}
