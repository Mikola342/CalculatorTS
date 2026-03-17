const state = {
  currentDay: 'Понедельник',
  items: [],
  quantities: {},
  isAdmin: false,
  isDbConnected: false,
  bonuses: [],
  bonusPercents: {}
};

const dayIcons = {
  'Понедельник': '🌙',
  'Вторник': '🏗️',
  'Среда': '🔬',
  'Четверг': '🦸',
  'Пятница': '⚔️'
};

async function fetchItems(day) {
  const res = await fetch(`/api/items?day=${encodeURIComponent(day)}`);
  if (!res.ok) throw new Error('Ошибка сервера');
  return res.json();
}

async function fetchBonuses() {
  const res = await fetch('/api/bonuses');
  if (!res.ok) throw new Error('Ошибка сервера бонусов');
  return res.json();
}

function isPurchaseItem(item) {
  const name = (item.name || '').toLowerCase();
  return name.includes('покупая наборы');
}

function getActiveBonuses() {
  return state.bonuses.filter((b) => {
    const day = b.day || 'Все дни';
    return day === 'Все дни' || day === state.currentDay;
  });
}

function splitTargetItemName(targetItemName) {
  if (targetItemName.includes('|')) {
    return targetItemName.split('|').map(part => part.trim());
  }
  return [targetItemName.trim()];
}

function getTotalBonusMultiplier(item) {
  let totalPercent = 0;
  
  for (const bonus of getActiveBonuses()) {
    const v = state.bonusPercents[bonus.id] || 0;
    // 1. Проверка привязки к предмету
    console.log('bonusName = ' + bonus.name);
    console.log('itemName = ' + item.name);
    console.log('targetItemName = ' + bonus.targetitemname)

    if (!bonus.targetitemname) {
      totalPercent += v;
    } else {
      const parts = splitTargetItemName(bonus.targetitemname);

      parts.forEach(part => {
        if (part == item.name) {
        totalPercent += v;
      }
      })
      
    }
  }
  
  return 1 + totalPercent / 100;
}

async function checkAuthStatus() {
  try {
    const res = await fetch('/api/auth/status');
    const data = await res.json();
    state.isAdmin = data.isAdmin;
  } catch {
    state.isAdmin = false;
  }
}

function updateDbStatusUI() {
  const dot = document.querySelector('#dbStatus .status-dot');
  const text = document.querySelector('#dbStatus .status-text');
  if (!dot || !text) return;
  dot.className = 'status-dot ' + (state.isDbConnected ? 'connected' : 'disconnected');
  text.textContent = state.isDbConnected ? 'PostgreSQL подключена' : 'Ошибка подключения';
}

function updateAuthUI() {
  const authBtn = document.getElementById('authBtn');
  const adminPanel = document.getElementById('adminPanel');

  if (state.isAdmin) {
    authBtn.textContent = '🛡️ Выйти из админки';
    authBtn.classList.add('admin-active');
    adminPanel.style.display = 'block';
  } else {
    authBtn.textContent = '🔑 Войти';
    authBtn.classList.remove('admin-active');
    adminPanel.style.display = 'none';
  }

  renderItems();
}

async function loadItems(day) {
  const list = document.getElementById('itemsList');
  list.innerHTML = `<div class="loading-spinner"><div class="spinner"></div><p>Загрузка...</p></div>`;
  try {
    state.items = await fetchItems(day);
    renderItems();
  } catch {
    list.innerHTML = `<p style="color:var(--danger);padding:20px;text-align:center">Ошибка загрузки данных</p>`;
  }
}

function renderItems() {
  const list = document.getElementById('itemsList');
  if (!state.items.length) {
    list.innerHTML = '<p class="no-items">Нет данных для этого дня</p>';
    return;
  }

  list.innerHTML = state.items.map(item => {
    const id = item.id !== undefined ? item.id : item._id;
    const hasVal = (state.quantities[id] || 0) > 0;
    const basePrice = item.price;
    const effectivePrice = isPurchaseItem(item)
      ? basePrice
      : Math.round(basePrice * getTotalBonusMultiplier(item));
    
    return `
      <div class="item-row ${hasVal ? 'has-value' : ''} ${state.isAdmin ? 'admin-mode' : ''}" id="row-${id}">
        <div class="item-name">${escapeHtml(item.name)}</div>
        <div class="item-price">${formatNumber(effectivePrice)}</div>
        <input
          type="number"
          class="qty-input"
          min="0"
          value="${state.quantities[id] || ''}"
          placeholder="0"
          data-id="${id}"
          data-price="${item.price}"
          data-name="${escapeHtml(item.name)}"
        />
        ${state.isAdmin ? `<button class="delete-btn" data-id="${id}" title="Удалить">✕</button>` : ''}
      </div>
    `;
  }).join('');

  list.querySelectorAll('.qty-input').forEach(i => i.addEventListener('input', handleQtyChange));
  if (state.isAdmin) {
    list.querySelectorAll('.delete-btn').forEach(b => b.addEventListener('click', handleDelete));
  }
}

function handleQtyChange(e) {
  const id = e.target.dataset.id;
  const val = parseInt(e.target.value, 10) || 0;
  if (val > 0) state.quantities[id] = val;
  else delete state.quantities[id];
  document.getElementById(`row-${id}`)?.classList.toggle('has-value', val > 0);
  updateResult();
}

function updateResult() {
  let total = 0;
  const breakdown = [];

  state.items.forEach(item => {
    const id = item.id !== undefined ? item.id : item._id;
    const qty = state.quantities[id] || 0;
    if (qty > 0) {
      const basePrice = item.price;
      const effectivePrice = isPurchaseItem(item)
        ? basePrice
        : Math.round(basePrice * getTotalBonusMultiplier(item));
      const strName = item.name;
      const num = strName.match(/(?<=Собрать\s+)\d+/);
      let score;
      if (num) {
        const number = Number(num[0]);
        score = qty * (effectivePrice / number);
      } else {
        score = qty * effectivePrice;
      }
      total += score;
      breakdown.push({ name: item.name, qty, price: effectivePrice, score });
    }
  });

  const totalEl = document.getElementById('totalPoints');
  const fmtEl = document.getElementById('totalFormatted');
  const breakdownEl = document.getElementById('breakdownList');

  const prev = parseInt(totalEl.textContent.replace(/\s/g, '').replace(/\u00a0/g, ''), 10) || 0;
  animateNumber(totalEl, prev, total, 300);

  fmtEl.textContent = total >= 1000000
    ? (total / 1000000).toFixed(2) + ' млн'
    : total >= 1000 ? (total / 1000).toFixed(1) + ' тыс.' : '';

  if (!breakdown.length) {
    breakdownEl.innerHTML = '<p class="no-items">Введите количество для расчёта</p>';
  } else {
    breakdown.sort((a, b) => b.score - a.score);
    breakdownEl.innerHTML = breakdown.map(b => `
      <div class="breakdown-item">
        <span class="breakdown-item-name">${escapeHtml(b.name)} × ${formatNumber(b.qty)}</span>
        <span class="breakdown-item-score">${formatNumber(b.score)}</span>
      </div>
    `).join('');
  }
}

function renderBonuses() {
  const container = document.getElementById('bonusList');
  if (!container) return;

  const activeBonuses = getActiveBonuses();

  if (!state.bonuses.length) {
    container.innerHTML = '<p class="no-items">Добавьте бонусы в базе данных</p>';
    return;
  }

  if (!activeBonuses.length) {
    container.innerHTML = '<p class="no-items">Нет бонусов для выбранного дня</p>';
    return;
  }

  container.innerHTML = activeBonuses
    .map(bonus => {
      const value = state.bonusPercents[bonus.id] ?? '';
      return `
        <div class="bonus-item">
          <span class="bonus-name">${escapeHtml(bonus.name)}</span>
          <input
            type="number"
            class="bonus-input"
            data-id="${bonus.id}"
            min="0"
            max="500"
            value="${value}"
            placeholder="0"
          />
          <span class="bonus-input-suffix">%</span>
        </div>
      `;
    })
    .join('');

  container.querySelectorAll('.bonus-input').forEach(input => {
    input.addEventListener('input', () => {
      const id = input.dataset.id;
      const val = parseFloat(input.value.replace(',', '.')) || 0;
      state.bonusPercents[id] = val;
      renderItems();
      updateResult();
    });
  });
}

function animateNumber(el, from, to, duration) {
  const start = performance.now();
  const update = (now) => {
    const p = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = formatNumber(Math.round(from + (to - from) * eased));
    if (p < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

async function handleDelete(e) {
  const id = e.target.dataset.id;
  if (!confirm('Удалить этот пункт?')) return;
  try {
    const res = await fetch(`/api/items/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error();
    showToast('Удалено', 'success');
    await loadItems(state.currentDay);
    updateResult();
  } catch {
    showToast('Ошибка удаления', 'error');
  }
}

document.querySelectorAll('.day-btn').forEach(btn => {
  btn.addEventListener('click', async () => {
    document.querySelectorAll('.day-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.currentDay = btn.dataset.day;
    document.getElementById('currentDayTitle').textContent = state.currentDay;
    renderBonuses();
    state.quantities = {};
    updateResult();
    await loadItems(state.currentDay);
  });
});

document.getElementById('resetBtn').addEventListener('click', () => {
  state.quantities = {};
  document.querySelectorAll('.qty-input').forEach(i => { i.value = ''; });
  document.querySelectorAll('.item-row').forEach(r => r.classList.remove('has-value'));
  updateResult();
  showToast('Сброшено', 'success');
});

document.getElementById('adminToggle').addEventListener('click', () => {
  const body = document.getElementById('adminBody');
  const arrow = document.querySelector('.admin-arrow');
  const open = body.style.display === 'none';
  body.style.display = open ? 'block' : 'none';
  arrow.classList.toggle('open', open);
});

document.getElementById('addForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('newName').value.trim();
  const price = parseInt(document.getElementById('newPrice').value, 10);
  const day = document.getElementById('newDay').value;
  if (!name || !price) return;

  try {
    const res = await fetch('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, price, day })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Ошибка');
    }
    showToast('Добавлено!', 'success');
    document.getElementById('addForm').reset();
    if (day === state.currentDay) await loadItems(state.currentDay);
  } catch (err) {
    showToast(err.message, 'error');
  }
});

document.getElementById('copyBtn').addEventListener('click', () => {
  const total = document.getElementById('totalPoints').textContent;
  const lines = Array.from(document.querySelectorAll('.breakdown-item')).map(el =>
    `${el.querySelector('.breakdown-item-name').textContent} = ${el.querySelector('.breakdown-item-score').textContent}`
  ).join('\n');
  const text = `${dayIcons[state.currentDay]} ${state.currentDay} — ${total} очков\n${lines}`;
  navigator.clipboard.writeText(text).then(() => showToast('Скопировано!', 'success'));
});

const authBtn = document.getElementById('authBtn');
const loginOverlay = document.getElementById('loginOverlay');
const loginForm = document.getElementById('loginForm');
const modalClose = document.getElementById('modalClose');
const loginError = document.getElementById('loginError');
const passwordInput = document.getElementById('passwordInput');
const eyeBtn = document.getElementById('eyeBtn');

authBtn.addEventListener('click', async () => {
  if (state.isAdmin) {
    await fetch('/api/auth/logout', { method: 'POST' });
    state.isAdmin = false;
    updateAuthUI();
    showToast('Выход выполнен', 'success');
  } else {
    openModal();
  }
});

function openModal() {
  loginOverlay.classList.add('open');
  passwordInput.value = '';
  loginError.textContent = '';
  setTimeout(() => passwordInput.focus(), 100);
}

function closeModal() {
  loginOverlay.classList.remove('open');
}

modalClose.addEventListener('click', closeModal);
loginOverlay.addEventListener('click', (e) => { if (e.target === loginOverlay) closeModal(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

eyeBtn.addEventListener('click', () => {
  const isPassword = passwordInput.type === 'password';
  passwordInput.type = isPassword ? 'text' : 'password';
  eyeBtn.textContent = isPassword ? '🙈' : '👁';
});

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const password = passwordInput.value;
  loginError.textContent = '';

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    const data = await res.json();

    if (res.ok) {
      state.isAdmin = true;
      closeModal();
      updateAuthUI();
      showToast('Добро пожаловать, Admin!', 'success');
    } else {
      loginError.textContent = data.error || 'Неверный пароль';
      passwordInput.value = '';
      passwordInput.focus();
    }
  } catch {
    loginError.textContent = 'Ошибка соединения';
  }
});

function showToast(msg, type = '') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = `toast show ${type}`;
  setTimeout(() => { toast.className = 'toast'; }, 3000);
}

function formatNumber(n) {
  if (Number.isInteger(n)) return n.toLocaleString('ru-RU');
  return n.toLocaleString('ru-RU', { maximumFractionDigits: 4 });
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function createParticles() {
  const container = document.getElementById('particles');
  for (let i = 0; i < 20; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.left = Math.random() * 100 + '%';
    p.style.animationDuration = (Math.random() * 15 + 10) + 's';
    p.style.animationDelay = (Math.random() * 15) + 's';
    p.style.width = p.style.height = (Math.random() * 3 + 1) + 'px';
    p.style.background = Math.random() > 0.5 ? 'var(--accent)' : 'var(--accent-secondary)';
    container.appendChild(p);
  }
}

async function init() {
  createParticles();

  const [authResult, itemsResult, bonusesResult] = await Promise.allSettled([
    checkAuthStatus(),
    fetchItems(state.currentDay),
    fetchBonuses()
  ]);

  if (itemsResult.status === 'fulfilled') {
    state.items = itemsResult.value;
    state.isDbConnected = state.items.length > 0 && typeof state.items[0].id === 'number';
  } else {
    state.isDbConnected = false;
  }
  updateDbStatusUI();
  updateAuthUI();

  state.bonuses = bonusesResult.status === 'fulfilled' ? bonusesResult.value : [];
  renderBonuses();
  renderItems();
}

init();
