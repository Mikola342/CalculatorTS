const state = {
  heroes: [],
  costsMap: {},
  user: null
};

// ─── Алгоритм ─────────────────────────────────────────────

function buildCostsMap(costsArray) {
  const map = {};
  if (!Array.isArray(costsArray)) return map;
  for (const row of costsArray) {
    if (!map[row.stars]) map[row.stars] = {};
    map[row.stars][row.rank] = (row.cost !== undefined) ? row.cost : null;
  }
  return map;
}

function getNextStep(stars, rank) {
  let s = stars;
  let r = rank;
  while (s <= 9) {
    r += 1;
    if (r > 5) { r = 0; s += 1; }
    if (s > 9) return null;
    const cost = state.costsMap[s] && state.costsMap[s][r] != null
      ? state.costsMap[s][r]
      : null;
    if (cost !== null) {
      return { stars: s, rank: r, cost };
    }
  }
  return null;
}

function calcHeroUpgrades(stars, rank, availableFragments) {
  let s = stars;
  let r = rank;
  let remaining = availableFragments;
  let fragmentsUsed = 0;
  let levelsGained = 0;

  while (remaining > 0) {
    const next = getNextStep(s, r);
    if (!next) break;
    if (next.cost > remaining) break;
    remaining -= next.cost;
    fragmentsUsed += next.cost;
    s = next.stars;
    r = next.rank;
    levelsGained += 1;
  }

  return { levelsGained, fragmentsUsed, finalStars: s, finalRank: r, remaining };
}

function calcRemainingCapacity(stars, rank) {
  let s = stars;
  let r = rank;
  let total = 0;
  while (true) {
    const next = getNextStep(s, r);
    if (!next) break;
    total += next.cost;
    s = next.stars;
    r = next.rank;
  }
  return total;
}

function getRowState(row) {
  return {
    stars:     Math.max(0, Math.min(9, parseInt(row.querySelector('.stars-input').value) || 0)),
    rank:      Math.max(0, Math.min(5, parseInt(row.querySelector('.rank-input').value)  || 0)),
    fragments: Math.max(0, parseInt(row.querySelector('.frags-input').value) || 0),
    blocked:   row.dataset.blocked === 'true'
  };
}

function distributeUniversal(rarity, universalCount) {
  if (universalCount <= 0) return { perHero: [], totalUsed: 0 };

  const eligible = [];
  for (const hero of state.heroes) {
    if (hero.rarity !== rarity) continue;
    const row = document.querySelector(`.hero-row[data-hero-id="${hero.id}"]`);
    if (!row) continue;
    const rs = getRowState(row);
    if (rs.blocked) continue;

    const specific = calcHeroUpgrades(rs.stars, rs.rank, rs.fragments);
    const capacity = calcRemainingCapacity(specific.finalStars, specific.finalRank);
    if (capacity > 0) {
      eligible.push({ hero, rs, afterSpecific: specific, capacity });
    }
  }

  eligible.sort((a, b) => b.capacity - a.capacity);

  const perHero = [];
  let remaining = universalCount;

  for (const item of eligible) {
    if (remaining <= 0) break;
    const give = Math.min(remaining, item.capacity);
    if (give <= 0) continue;
    const uResult = calcHeroUpgrades(
      item.afterSpecific.finalStars,
      item.afterSpecific.finalRank,
      give
    );
    if (uResult.fragmentsUsed > 0) {
      perHero.push({
        heroId:     item.hero.id,
        heroName:   item.hero.name,
        rarity:     item.hero.rarity,
        allocated:  uResult.fragmentsUsed,
        levelsGained: uResult.levelsGained,
        fromStars:  item.afterSpecific.finalStars,
        fromRank:   item.afterSpecific.finalRank,
        toStars:    uResult.finalStars,
        toRank:     uResult.finalRank
      });
      remaining -= give;
    }
  }

  return { perHero, totalUsed: perHero.reduce((s, x) => s + x.allocated, 0) };
}

// ─── Рендер ───────────────────────────────────────────────

function rarityClass(r) { return 'rarity-' + r.toLowerCase(); }

function renderHeroes() {
  const container = document.getElementById('heroesContainer');
  if (!container) return;

  if (!Array.isArray(state.heroes) || !state.heroes.length) {
    container.innerHTML = '<p class="no-result">Герои не загружены</p>';
    return;
  }

  const groups = { SSR: [], SR: [], R: [] };
  for (const h of state.heroes) {
    if (groups[h.rarity]) groups[h.rarity].push(h);
  }

  let html = '';
  for (const rarity of ['SSR', 'SR', 'R']) {
    const heroes = groups[rarity];
    if (!heroes.length) continue;

    html += `
      <div class="rarity-section">
        <div class="rarity-header">
          <span class="rarity-badge ${rarityClass(rarity)}">${rarity}</span>
          <span class="rarity-title">Герои редкости ${rarity}</span>
        </div>
        <div class="hero-col-header">
          <span class="hero-col-label">Герой</span>
          <span class="hero-col-label">★</span>
          <span class="hero-col-label">Ранг</span>
          <span class="hero-col-label">Фрагм.</span>
          <span class="hero-col-label">MAX</span>
          <span class="hero-col-label">Блок</span>
        </div>`;

    for (const hero of heroes) {
      html += `
        <div class="hero-row" data-hero-id="${hero.id}" data-rarity="${hero.rarity}" data-blocked="false">
          <div class="hero-name-col">
            <span class="hero-name-text">${hero.name}</span>
            <span class="hero-result-hint" id="hint-${hero.id}"></span>
          </div>
          <input type="number" class="hero-input stars-input" min="0" max="9" value="0" />
          <input type="number" class="hero-input rank-input"  min="0" max="5" value="0" />
          <input type="number" class="hero-input frags-input" min="0"       value="0" />
          <button class="max-btn"    data-action="max"   data-hero-id="${hero.id}">MAX</button>
          <button class="block-btn"  data-action="block" data-hero-id="${hero.id}" title="Персонаж недоступен">ДОСТУПЕН</button>
        </div>`;
    }
    html += '</div>';
  }

  container.innerHTML = html;
}

function handleMaxClick(heroId) {
  const row = document.querySelector(`.hero-row[data-hero-id="${heroId}"]`);
  if (!row) return;
  if (row.dataset.blocked === 'true') return;

  const rs = getRowState(row);
  if (!Object.keys(state.costsMap).length) {
    showToast('Таблица стоимостей не загружена', 'error');
    return;
  }

  const result = calcHeroUpgrades(rs.stars, rs.rank, rs.fragments);
  row.querySelector('.stars-input').value = result.finalStars;
  row.querySelector('.rank-input').value  = result.finalRank;

  const hint = document.getElementById(`hint-${heroId}`);
  if (hint) {
    if (result.levelsGained > 0) {
      hint.textContent = `+${result.levelsGained} ур. (исп. ${result.fragmentsUsed} фр.)`;
      row.classList.add('has-result');
    } else if (rs.fragments === 0) {
      hint.textContent = 'Введите количество фрагментов';
      row.classList.remove('has-result');
    } else {
      hint.textContent = 'Фрагментов недостаточно для следующего ур.';
      row.classList.remove('has-result');
    }
  }
}

function handleBlockClick(heroId) {
  const row = document.querySelector(`.hero-row[data-hero-id="${heroId}"]`);
  if (!row) return;

  const isBlocked = row.dataset.blocked === 'true';
  const newBlocked = !isBlocked;
  row.dataset.blocked = String(newBlocked);

  const btn = row.querySelector('.block-btn');
  if (btn) {
    btn.textContent = newBlocked ? 'НЕ ДОСТУПЕН' : 'ДОСТУПЕН';
    btn.classList.toggle('block-btn-active', newBlocked);
  }

  row.classList.toggle('hero-blocked', newBlocked);

  const hint = document.getElementById(`hint-${heroId}`);
  if (hint) {
    hint.textContent = newBlocked ? 'Недоступен' : '';
  }
}

function renderResults(resultsR, resultsSR, resultsSSR, heroSpecificResults) {
  const totalR   = (resultsR.totalUsed   || 0) + heroSpecificResults.filter(h => h.rarity === 'R').reduce((s, h) => s + h.allocated, 0);
  const totalSR  = (resultsSR.totalUsed  || 0) + heroSpecificResults.filter(h => h.rarity === 'SR').reduce((s, h) => s + h.allocated, 0);
  const totalSSR = (resultsSSR.totalUsed || 0) + heroSpecificResults.filter(h => h.rarity === 'SSR').reduce((s, h) => s + h.allocated, 0);

  document.getElementById('totalR').textContent   = totalR;
  document.getElementById('totalSR').textContent  = totalSR;
  document.getElementById('totalSSR').textContent = totalSSR;

  const allAllocations = [
    ...heroSpecificResults.map(r => ({ ...r, source: 'specific' })),
    ...resultsR.perHero.map(r   => ({ ...r, source: 'universal' })),
    ...resultsSR.perHero.map(r  => ({ ...r, source: 'universal' })),
    ...resultsSSR.perHero.map(r => ({ ...r, source: 'universal' }))
  ].filter(r => r.levelsGained > 0);

  const list = document.getElementById('allocationList');

  if (!allAllocations.length) {
    list.innerHTML = '<p class="no-result">Нет прогресса. Добавьте фрагменты героям.</p>';
    return;
  }

  let html = '';
  for (const item of allAllocations) {
    const rc = rarityClass(item.rarity);
    const frType = item.source === 'universal' ? 'универс.' : 'личные';
    const arrow = `${item.fromStars}★р${item.fromRank} → ${item.toStars}★р${item.toRank}`;

    html += `
      <div class="alloc-item">
        <div>
          <div class="alloc-hero">
            <span class="rarity-badge ${rc} badge-sm">${item.rarity}</span>
            ${item.heroName}
          </div>
          <div class="alloc-detail">${arrow} · +${item.levelsGained} ур. · ${frType}</div>
        </div>
        <div class="alloc-frags ${rc}">${item.allocated}&nbsp;фр.</div>
      </div>`;
  }
  list.innerHTML = html;

  document.querySelectorAll('.hero-row').forEach(row => row.classList.remove('has-result'));
  for (const item of allAllocations) {
    const row = document.querySelector(`.hero-row[data-hero-id="${item.heroId}"]`);
    if (row) {
      row.classList.add('has-result');
      const hint = document.getElementById(`hint-${item.heroId}`);
      if (hint) hint.textContent = `+${item.levelsGained} ур. (исп. ${item.allocated} фр.)`;
    }
  }
}

// ─── Расчёт ───────────────────────────────────────────────

function calculate() {
  if (!Array.isArray(state.heroes) || !state.heroes.length) {
    showToast('Герои не загружены', 'error');
    return;
  }
  if (!Object.keys(state.costsMap).length) {
    showToast('Таблица стоимостей не загружена', 'error');
    return;
  }

  const univR   = Math.max(0, parseInt(document.getElementById('univR').value)   || 0);
  const univSR  = Math.max(0, parseInt(document.getElementById('univSR').value)  || 0);
  const univSSR = Math.max(0, parseInt(document.getElementById('univSSR').value) || 0);

  const heroSpecific = [];
  document.querySelectorAll('.hero-row').forEach(row => {
    if (row.dataset.blocked === 'true') return;
    const heroId = parseInt(row.dataset.heroId);
    const hero = state.heroes.find(h => h.id === heroId);
    if (!hero) return;
    const rs = getRowState(row);
    if (rs.fragments === 0) return;

    const result = calcHeroUpgrades(rs.stars, rs.rank, rs.fragments);
    if (result.levelsGained > 0) {
      heroSpecific.push({
        heroId,
        heroName:   hero.name,
        rarity:     hero.rarity,
        allocated:  result.fragmentsUsed,
        levelsGained: result.levelsGained,
        fromStars:  rs.stars,
        fromRank:   rs.rank,
        toStars:    result.finalStars,
        toRank:     result.finalRank,
        source:     'specific'
      });
    }
  });

  const resultsR   = distributeUniversal('R',   univR);
  const resultsSR  = distributeUniversal('SR',  univSR);
  const resultsSSR = distributeUniversal('SSR', univSSR);

  renderResults(resultsR, resultsSR, resultsSSR, heroSpecific);
}

// ─── API / Сохранение / Загрузка ─────────────────────────

async function loadHeroesData() {
  const container = document.getElementById('heroesContainer');
  try {
    const [heroesRes, costsRes] = await Promise.all([
      fetch('/api/heroes'),
      fetch('/api/heroes/fragment-costs')
    ]);

    const heroesData = await heroesRes.json();
    const costsData  = await costsRes.json();

    if (!heroesRes.ok || !Array.isArray(heroesData)) {
      throw new Error(heroesData.error || 'Ошибка загрузки героев');
    }

    state.heroes   = heroesData;
    state.costsMap = buildCostsMap(Array.isArray(costsData) ? costsData : []);
    renderHeroes();
  } catch (err) {
    if (container) {
      container.innerHTML = `<p class="no-result">Ошибка загрузки: ${err.message}</p>`;
    }
  }
}

async function loadUserState() {
  if (!state.user) return;
  try {
    const res = await fetch('/api/heroes/state');
    if (!res.ok) return;
    const saved = await res.json();
    if (!Array.isArray(saved)) return;
    for (const entry of saved) {
      const row = document.querySelector(`.hero-row[data-hero-id="${entry.hero_id}"]`);
      if (!row) continue;
      row.querySelector('.stars-input').value = entry.stars    || 0;
      row.querySelector('.rank-input').value  = entry.rank     || 0;
      row.querySelector('.frags-input').value = entry.fragments || 0;
      if (entry.blocked) {
        row.dataset.blocked = 'true';
        row.classList.add('hero-blocked');
        const btn = row.querySelector('.block-btn');
        if (btn) { btn.textContent = 'НЕ ДОСТУПЕН'; btn.classList.add('block-btn-active'); }
        const hint = document.getElementById(`hint-${entry.hero_id}`);
        if (hint) hint.textContent = 'Недоступен';
      }
    }
  } catch {}
}

async function saveState() {
  if (!state.user) { openLoginModal(); return; }

  const entries = [];
  document.querySelectorAll('.hero-row').forEach(row => {
    entries.push({
      heroId:    parseInt(row.dataset.heroId),
      stars:     parseInt(row.querySelector('.stars-input').value) || 0,
      rank:      parseInt(row.querySelector('.rank-input').value)  || 0,
      fragments: parseInt(row.querySelector('.frags-input').value) || 0,
      blocked:   row.dataset.blocked === 'true'
    });
  });

  try {
    const res = await fetch('/api/heroes/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entries)
    });
    const data = await res.json();
    if (res.ok) {
      showToast('Сохранено', 'success');
    } else {
      showToast(data.error || 'Ошибка сохранения', 'error');
    }
  } catch {
    showToast('Ошибка сети', 'error');
  }
}

function resetAll() {
  document.querySelectorAll('.hero-row').forEach(row => {
    row.querySelector('.stars-input').value = 0;
    row.querySelector('.rank-input').value  = 0;
    row.querySelector('.frags-input').value = 0;
    row.classList.remove('has-result', 'hero-blocked');
    row.dataset.blocked = 'false';
    const heroId = row.dataset.heroId;
    const hint = document.getElementById(`hint-${heroId}`);
    if (hint) hint.textContent = '';
    const blockBtn = row.querySelector('.block-btn');
    if (blockBtn) { blockBtn.textContent = '✓'; blockBtn.classList.remove('block-btn-active'); }
  });
  ['univR', 'univSR', 'univSSR'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = 0;
  });
  ['totalR', 'totalSR', 'totalSSR'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = '—';
  });
  const list = document.getElementById('allocationList');
  if (list) list.innerHTML = '<p class="no-result">Нажмите «Рассчитать» чтобы увидеть результат</p>';
}

// ─── Авторизация ──────────────────────────────────────────

function openLoginModal() {
  const el = document.getElementById('userLoginOverlay');
  if (el) el.style.display = 'flex';
}

function closeLoginModal() {
  const el = document.getElementById('userLoginOverlay');
  if (el) el.style.display = 'none';
  const err = document.getElementById('userLoginError');
  if (err) err.textContent = '';
}

function updateAuthUI() {
  const label = document.getElementById('userLabel');
  const btn   = document.getElementById('userAuthBtn');
  if (label) label.textContent = state.user ? state.user.username : 'Гость';
  if (btn)   btn.textContent   = state.user ? 'Выйти' : 'Войти';
}

async function checkAuth() {
  try {
    const res = await fetch('/api/users/me');
    if (res.ok) {
      const data = await res.json();
      if (data && data.user) {
        state.user = data.user;
        updateAuthUI();
        await loadUserState();
      }
    }
  } catch {}
}

// ─── Toast ────────────────────────────────────────────────

function showToast(msg, type) {
  const t = document.getElementById('fragToast');
  if (!t) return;
  t.textContent = msg;
  t.className = 'toast show' + (type === 'error' ? ' toast-error' : '');
  setTimeout(() => { t.className = 'toast'; }, 2500);
}

// ─── Частицы ─────────────────────────────────────────────

function initParticles() {
  const container = document.getElementById('particles');
  if (!container) return;
  for (let i = 0; i < 30; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.cssText = [
      `left:${Math.random() * 100}%`,
      `top:${Math.random() * 100}%`,
      `animation-delay:${Math.random() * 8}s`,
      `animation-duration:${6 + Math.random() * 8}s`,
      `width:${2 + Math.random() * 3}px`,
      `height:${2 + Math.random() * 3}px`,
      `opacity:${0.1 + Math.random() * 0.3}`
    ].join(';');
    container.appendChild(p);
  }
}

// ─── Инициализация ───────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  initParticles();

  // Статичные кнопки — присоединяем сразу, до любых async-вызовов
  const calculateBtn  = document.getElementById('calculateBtn');
  const saveStateBtn  = document.getElementById('saveStateBtn');
  const resetAllBtn   = document.getElementById('resetAllBtn');
  const userAuthBtn   = document.getElementById('userAuthBtn');
  const userModalClose = document.getElementById('userModalClose');
  const userLoginOverlay = document.getElementById('userLoginOverlay');
  const userLoginForm = document.getElementById('userLoginForm');

  if (calculateBtn)  calculateBtn.addEventListener('click', calculate);
  if (saveStateBtn)  saveStateBtn.addEventListener('click', saveState);
  if (resetAllBtn)   resetAllBtn.addEventListener('click', resetAll);

  if (userAuthBtn) {
    userAuthBtn.addEventListener('click', () => {
      if (state.user) {
        fetch('/api/users/logout', { method: 'POST' })
          .then(() => { state.user = null; updateAuthUI(); showToast('Вы вышли из аккаунта'); })
          .catch(() => {});
      } else {
        openLoginModal();
      }
    });
  }

  if (userModalClose) userModalClose.addEventListener('click', closeLoginModal);
  if (userLoginOverlay) {
    userLoginOverlay.addEventListener('click', e => {
      if (e.target === userLoginOverlay) closeLoginModal();
    });
  }

  if (userLoginForm) {
    userLoginForm.addEventListener('submit', async e => {
      e.preventDefault();
      const username = document.getElementById('usernameInput').value.trim();
      const password = document.getElementById('userPasswordInput').value;
      const isReg    = document.getElementById('isRegisterCheckbox').checked;
      const errEl    = document.getElementById('userLoginError');
      if (errEl) errEl.textContent = '';

      try {
        const url = isReg ? '/api/users/register' : '/api/users/login';
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (!res.ok) {
          if (errEl) errEl.textContent = data.error || 'Ошибка';
          return;
        }
        state.user = data.user || { username };
        updateAuthUI();
        closeLoginModal();
        showToast('Вход выполнен');
        await loadUserState();
      } catch {
        if (errEl) errEl.textContent = 'Ошибка сети';
      }
    });
  }

  // Event delegation для динамических кнопок в списке героев
  const heroesContainer = document.getElementById('heroesContainer');
  if (heroesContainer) {
    heroesContainer.addEventListener('click', e => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const heroId = btn.dataset.heroId;
      if (!heroId) return;
      if (btn.dataset.action === 'max')   handleMaxClick(heroId);
      if (btn.dataset.action === 'block') handleBlockClick(heroId);
    });
  }

  // Загружаем данные асинхронно — ошибки изолированы от UI
  loadHeroesData().then(() => checkAuth());
});
