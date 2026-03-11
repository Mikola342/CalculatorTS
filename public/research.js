const researchState = {
  items: [],
  userState: {},
  user: null
};

function minutesFromParts(days, hours, minutes) {
  const d = parseInt(days, 10) || 0;
  const h = parseInt(hours, 10) || 0;
  const m = parseInt(minutes, 10) || 0;
  return d * 24 * 60 + h * 60 + m;
}

function formatMinutes(total) {
  const t = Math.max(0, Math.round(total || 0));
  const days = Math.floor(t / (24 * 60));
  const remAfterDays = t % (24 * 60);
  const hours = Math.floor(remAfterDays / 60);
  const minutes = remAfterDays % 60;

  const parts = [];
  if (days) parts.push(`${days} д`);
  if (hours) parts.push(`${hours} ч`);
  if (minutes || !parts.length) parts.push(`${minutes} мин`);
  return parts.join(' ');
}

function formatNumberRu(n) {
  return (n || 0).toLocaleString('ru-RU');
}

async function fetchJson(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    // ignore
  }
  if (!res.ok) {
    const msg = (data && data.error) || 'Ошибка запроса';
    throw new Error(msg);
  }
  return data;
}

async function loadCurrentUser() {
  try {
    const data = await fetchJson('/api/users/me', { method: 'GET' });
    researchState.user = data.user || null;
  } catch {
    researchState.user = null;
  }
  updateUserAuthUI();
}

function updateUserAuthUI() {
  const label = document.getElementById('userLabel');
  const btn = document.getElementById('userAuthBtn');

  if (researchState.user) {
    label.textContent = `👤 ${researchState.user.username}`;
    btn.textContent = 'Выйти';
  } else {
    label.textContent = 'Гость';
    btn.textContent = 'Войти';
  }
}

function showResearchToast(msg, type = '') {
  const toast = document.getElementById('researchToast');
  toast.textContent = msg;
  toast.className = `toast show ${type}`;
  setTimeout(() => {
    toast.className = 'toast';
  }, 3000);
}

async function loadResearchItems() {
  const list = document.getElementById('researchList');
  list.innerHTML =
    '<div class="loading-spinner"><div class="spinner"></div><p>Загрузка пунктов исследований...</p></div>';
  try {
    const items = await fetchJson('/api/research/items', { method: 'GET' });
    researchState.items = items;
    await loadResearchStateForUser();
    renderResearchItems();
  } catch (err) {
    list.innerHTML = `<p style="color:var(--danger);padding:20px;text-align:center">${err.message}</p>`;
  }
}

async function loadResearchStateForUser() {
  researchState.userState = {};
  if (!researchState.user) return;
  try {
    const data = await fetchJson('/api/research/state', { method: 'GET' });
    for (const row of data) {
      researchState.userState[row.research_item_id] = {
        currentLevel: row.current_level,
        blocked: !!row.blocked,
        powerPerLevel: row.power_per_level_override,
        timeMinutes: row.time_minutes_override
      };
    }
  } catch {
    // ignore, просто нет сохранений
  }
}

function renderResearchItems() {
  const list = document.getElementById('researchList');
  if (!researchState.items.length) {
    list.innerHTML =
      '<p class="no-items">В базе пока нет пунктов исследований. Добавьте их через базу данных или Excel.</p>';
    return;
  }

  const rows = researchState.items
    .map((item) => {
      const state = researchState.userState[item.id] || {};
      const currentLevel = state.currentLevel || 0;
      const blocked = !!state.blocked;
      const groupName = item.group_name || '';
      const effectivePower =
        state.powerPerLevel != null ? state.powerPerLevel : item.power_per_level;
      const timeMinutes =
        state.timeMinutes != null ? state.timeMinutes : item.time_minutes || 60;
      const days = Math.floor(timeMinutes / (24 * 60));
      const remAfterDays = timeMinutes % (24 * 60);
      const hours = Math.floor(remAfterDays / 60);
      const minutes = remAfterDays % 60;

      return `
        <div class="item-row research-row ${blocked ? 'blocked' : ''}" data-id="${item.id}">
          <div class="item-name">
            <div class="item-name-main">${item.name}</div>
            ${groupName ? `<div class="item-name-sub">${groupName}</div>` : ''}
          </div>
          <div class="research-cell">
            <label>Тек. ур.</label>
            <input type="number"
              class="research-input level-input"
              min="0"
              max="${item.max_level}"
              value="${currentLevel}"
            />
            <span class="research-hint">из ${item.max_level}</span>
          </div>
          <div class="research-cell">
            <label>Сила / уровень</label>
            <input type="number"
              class="research-input power-input"
              min="0"
              value="${effectivePower}"
            />
          </div>
          <div class="research-cell time-cell">
            <label>Время / уровень</label>
            <div class="time-inputs">
              <input type="number" class="research-input time-day" min="0" value="${days}" />
              <span class="time-label">д</span>
              <input type="number" class="research-input time-hour" min="0" max="23" value="${hours}" />
              <span class="time-label">ч</span>
              <input type="number" class="research-input time-minute" min="0" max="59" value="${minutes}" />
              <span class="time-label">м</span>
            </div>
          </div>
          <div class="research-cell block-cell">
            <label>Блок</label>
            <input type="checkbox" class="block-checkbox" ${blocked ? 'checked' : ''} />
          </div>
        </div>
      `;
    })
    .join('');

  list.innerHTML = rows;
}

function collectCurrentResearchConfig() {
  const rows = Array.from(document.querySelectorAll('.research-row'));
  const config = [];

  for (const row of rows) {
    const id = parseInt(row.dataset.id, 10);
    const levelInput = row.querySelector('.level-input');
    const powerInput = row.querySelector('.power-input');
    const dayInput = row.querySelector('.time-day');
    const hourInput = row.querySelector('.time-hour');
    const minuteInput = row.querySelector('.time-minute');
    const blockCheckbox = row.querySelector('.block-checkbox');

    const item = researchState.items.find((i) => i.id === id);
    if (!item) continue;

    const currentLevel = Math.max(
      0,
      Math.min(item.max_level, parseInt(levelInput.value, 10) || 0)
    );
    const powerPerLevel = Math.max(0, parseInt(powerInput.value, 10) || 0);
    const timeMinutes = Math.max(
      1,
      minutesFromParts(dayInput.value, hourInput.value, minuteInput.value)
    );
    const blocked = !!blockCheckbox.checked;

    config.push({
      id,
      name: item.name,
      maxLevel: item.max_level,
      currentLevel,
      powerPerLevel,
      timeMinutes,
      blocked
    });
  }

  return config;
}

function calculateBestPlan() {
  const availableInput = document.getElementById('availableMinutes');
  const availMinutes = parseInt(availableInput.value, 10) || 0;

  if (availMinutes <= 0) {
    showResearchToast('Введите положительное количество минут', 'error');
    return;
  }

  const config = collectCurrentResearchConfig();
  if (!config.length) {
    showResearchToast('Нет пунктов для расчёта', 'error');
    return;
  }

  const upgrades = [];

  for (const item of config) {
    if (item.blocked) continue;
    const availableLevels = Math.max(0, item.maxLevel - item.currentLevel);
    if (availableLevels <= 0) continue;

    const ratio =
      item.timeMinutes > 0 ? item.powerPerLevel / item.timeMinutes : 0;

    for (let i = 0; i < availableLevels; i++) {
      upgrades.push({
        researchId: item.id,
        name: item.name,
        stepIndex: i + 1,
        powerGain: item.powerPerLevel,
        timeCost: item.timeMinutes,
        ratio
      });
    }
  }

  if (!upgrades.length) {
    showResearchToast('Все пункты либо заблокированы, либо на максимальном уровне', 'error');
    return;
  }

  upgrades.sort((a, b) => b.ratio - a.ratio);

  let remaining = availMinutes;
  let totalPower = 0;
  let usedTime = 0;

  const planPerResearch = new Map();

  for (const up of upgrades) {
    if (up.timeCost > remaining) continue;

    remaining -= up.timeCost;
    usedTime += up.timeCost;
    totalPower += up.powerGain;

    const prev = planPerResearch.get(up.researchId) || {
      name: up.name,
      levels: 0,
      totalPower: 0,
      totalTime: 0
    };

    prev.levels += 1;
    prev.totalPower += up.powerGain;
    prev.totalTime += up.timeCost;
    planPerResearch.set(up.researchId, prev);
  }

  renderPlanResult({
    totalPower,
    usedTime,
    remaining,
    plan: Array.from(planPerResearch.values())
  });
}

function renderPlanResult(result) {
  const totalPowerEl = document.getElementById('totalPowerGain');
  const totalFmtEl = document.getElementById('totalPowerFormatted');
  const usedTimeEl = document.getElementById('usedTime');
  const remainingTimeEl = document.getElementById('remainingTime');
  const planList = document.getElementById('planList');

  totalPowerEl.textContent = formatNumberRu(result.totalPower);
  totalFmtEl.textContent =
    result.totalPower >= 1_000_000
      ? (result.totalPower / 1_000_000).toFixed(2) + ' млн силы'
      : result.totalPower >= 1_000
      ? (result.totalPower / 1_000).toFixed(1) + ' тыс. силы'
      : '';

  usedTimeEl.textContent = formatMinutes(result.usedTime);
  remainingTimeEl.textContent =
    'Останется ' + formatMinutes(result.remaining) + ' свободного времени';

  if (!result.plan.length) {
    planList.innerHTML =
      '<p class="no-items">Не удалось подобрать ни одной прокачки в рамках указанного времени.</p>';
    return;
  }

  result.plan.sort((a, b) => b.totalPower - a.totalPower);

  planList.innerHTML = result.plan
    .map(
      (p) => `
    <div class="breakdown-item">
      <div class="breakdown-item-name">
        ${p.name}
      </div>
      <div class="breakdown-item-details">
        +${formatNumberRu(p.totalPower)} силы,
        уровней: ${p.levels},
        время: ${formatMinutes(p.totalTime)}
      </div>
    </div>
  `
    )
    .join('');
}

async function saveResearchState() {
  if (!researchState.user) {
    showResearchToast('Войдите в аккаунт, чтобы сохранять уровни', 'error');
    openUserModal();
    return;
  }

  const config = collectCurrentResearchConfig();
  if (!config.length) {
    showResearchToast('Нет данных для сохранения', 'error');
    return;
  }

  const payload = {
    items: config.map((c) => ({
      researchItemId: c.id,
      currentLevel: c.currentLevel,
      blocked: c.blocked,
      powerPerLevel: c.powerPerLevel,
      timeMinutes: c.timeMinutes
    }))
  };

  try {
    await fetchJson('/api/research/state', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    showResearchToast('Состояние исследований сохранено', 'success');
  } catch (err) {
    showResearchToast(err.message, 'error');
  }
}

function resetResearchLevels() {
  const rows = Array.from(document.querySelectorAll('.research-row'));
  for (const row of rows) {
    const levelInput = row.querySelector('.level-input');
    const blockCheckbox = row.querySelector('.block-checkbox');
    if (levelInput) levelInput.value = '0';
    if (blockCheckbox) blockCheckbox.checked = false;
    row.classList.remove('blocked');
  }
  document.getElementById('planList').innerHTML =
    '<p class="no-items">Укажите уровни и время, затем нажмите «Рассчитать»</p>';
  document.getElementById('totalPowerGain').textContent = '0';
  document.getElementById('totalPowerFormatted').textContent = '';
  document.getElementById('usedTime').textContent = '0 мин';
  document.getElementById('remainingTime').textContent = '';
}

function setupUserAuthModal() {
  const overlay = document.getElementById('userLoginOverlay');
  const form = document.getElementById('userLoginForm');
  const closeBtn = document.getElementById('userModalClose');
  const authBtn = document.getElementById('userAuthBtn');
  const errorEl = document.getElementById('userLoginError');

  authBtn.addEventListener('click', async () => {
    if (researchState.user) {
      try {
        await fetchJson('/api/users/logout', { method: 'POST' });
      } catch {
        // ignore
      }
      researchState.user = null;
      updateUserAuthUI();
      showResearchToast('Вы вышли из аккаунта', 'success');
    } else {
      openUserModal();
    }
  });

  function closeModal() {
    overlay.classList.remove('open');
  }

  closeBtn.addEventListener('click', () => {
    closeModal();
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeModal();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.textContent = '';

    const username = document.getElementById('usernameInput').value.trim();
    const password = document.getElementById('userPasswordInput').value;
    const isRegister = document.getElementById('isRegisterCheckbox').checked;

    if (!username || !password) {
      errorEl.textContent = 'Введите логин и пароль';
      return;
    }

    const endpoint = isRegister ? '/api/users/register' : '/api/users/login';

    try {
      const data = await fetchJson(endpoint, {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });
      researchState.user = data.user;
      updateUserAuthUI();
      await loadResearchStateForUser();
      renderResearchItems();
      overlay.classList.remove('open');
      showResearchToast(
        isRegister ? 'Аккаунт создан и вы вошли' : 'Вход выполнен',
        'success'
      );
    } catch (err) {
      errorEl.textContent = err.message;
    }
  });
}

function openUserModal() {
  const overlay = document.getElementById('userLoginOverlay');
  const errorEl = document.getElementById('userLoginError');
  overlay.classList.add('open');
  errorEl.textContent = '';
}

function createParticlesBackground() {
  const container = document.getElementById('particles');
  if (!container) return;
  for (let i = 0; i < 20; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.left = Math.random() * 100 + '%';
    p.style.animationDuration = Math.random() * 15 + 10 + 's';
    p.style.animationDelay = Math.random() * 15 + 's';
    p.style.width = p.style.height = Math.random() * 3 + 1 + 'px';
    p.style.background =
      Math.random() > 0.5 ? 'var(--accent)' : 'var(--accent-secondary)';
    container.appendChild(p);
  }
}

async function initResearchPage() {
  createParticlesBackground();
  setupUserAuthModal();
  await loadCurrentUser();
  await loadResearchItems();

  document
    .getElementById('calculatePlanBtn')
    .addEventListener('click', calculateBestPlan);

  document
    .getElementById('saveStateBtn')
    .addEventListener('click', saveResearchState);

  document
    .getElementById('resetResearchBtn')
    .addEventListener('click', resetResearchLevels);
}

initResearchPage();

