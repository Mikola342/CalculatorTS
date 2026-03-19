const state = {
  heroes: [],
  costsMap: {},
  user: null
};

// ─── Алгоритм ─────────────────────────────────────────────

function buildCostsMap(costsArray) {
  const map = {};
  for (const row of costsArray) {
    if (!map[row.stars]) map[row.stars] = {};
    map[row.stars][row.rank] = row.cost !== undefined ? row.cost : null;
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
    const cost = state.costsMap[s]?.[r];
    if (cost !== null && cost !== undefined) {
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

  return {
    levelsGained,
    fragmentsUsed,
    finalStars: s,
    finalRank: r,
    remaining
  };
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

function distributeUniversal(rarity, universalCount) {
  if (universalCount <= 0) return { perHero: [], totalUsed: 0 };

  const eligible = state.heroes
    .filter(h => h.rarity === rarity)
    .map(h => {
      const row = document.querySelector(`.hero-row[data-hero-id="${h.id}"]`);
      if (!row) return null;
      const stars = parseInt(row.querySelector('.stars-input').value) || 0;
      const rank  = parseInt(row.querySelector('.rank-input').value)  || 0;
      const frags = parseInt(row.querySelector('.frags-input').value) || 0;
      const specific = calcHeroUpgrades(stars, rank, frags);
      const capacity = calcRemainingCapacity(specific.finalStars, specific.finalRank);
      return { hero: h, stars, rank, frags, afterSpecific: specific, capacity };
    })
    .filter(x => x && x.capacity > 0)
    .sort((a, b) => b.capacity - a.capacity);

  const perHero = [];
  let remaining = universalCount;

  for (const item of eligible) {
    if (remaining <= 0) break;
    const give = Math.min(remaining, item.capacity);
    if (give > 0) {
      const uResult = calcHeroUpgrades(
        item.afterSpecific.finalStars,
        item.afterSpecific.finalRank,
        give
      );
      perHero.push({
        heroId: item.hero.id,
        heroName: item.hero.name,
        allocated: uResult.fragmentsUsed,
        levelsGained: uResult.levelsGained,
        fromStars: item.afterSpecific.finalStars,
        fromRank: item.afterSpecific.finalRank,
        toStars: uResult.finalStars,
        toRank: uResult.finalRank
      });
      remaining -= give;
    }
  }

  const totalUsed = perHero.reduce((s, x) => s + x.allocated, 0);
  return { perHero, totalUsed };
}

// ─── Рендер ───────────────────────────────────────────────

function rarityClass(r) { return 'rarity-' + r.toLowerCase(); }

function renderHeroes() {
  const container = document.getElementById('heroesContainer');
  if (!state.heroes.length) {
    container.innerHTML = '<p class="no-result">Герои не загружены</p>';
    return;
  }

  const groups = { SSR: [], SR: [], R: [] };
  for (const h of state.heroes) groups[h.rarity]?.push(h);

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
          <span class="hero-col-label"></span>
        </div>`;

    for (const hero of heroes) {
      html += `
        <div class="hero-row" data-hero-id="${hero.id}" data-rarity="${hero.rarity}">
          <div class="hero-name-col">
            <span class="hero-name-text">${hero.name}</span>
            <span class="hero-result-hint" id="hint-${hero.id}"></span>
          </div>
          <input type="number" class="hero-input stars-input"
                 min="0" max="9" value="0" title="Звёзды" />
          <input type="number" class="hero-input rank-input"
                 min="0" max="5" value="0" title="Ранг" />
          <input type="number" class="hero-input frags-input"
                 min="0" value="0" title="Фрагменты" />
          <button class="max-btn" data-hero-id="${hero.id}">MAX</button>
        </div>`;
    }
    html += '</div>';
  }

  container.innerHTML = html;
  attachMaxListeners();
}

function attachMaxListeners() {
  document.querySelectorAll('.max-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const heroId = btn.dataset.heroId;
      const row = document.querySelector(`.hero-row[data-hero-id="${heroId}"]`);
      if (!row) return;
      const stars = Math.max(0, Math.min(9, parseInt(row.querySelector('.stars-input').value) || 0));
      const rank  = Math.max(0, Math.min(5, parseInt(row.querySelector('.rank-input').value)  || 0));
      const frags = Math.max(0, parseInt(row.querySelector('.frags-input').value) || 0);

      const result = calcHeroUpgrades(stars, rank, frags);
      row.querySelector('.stars-input').value = result.finalStars;
      row.querySelector('.rank-input').value  = result.finalRank;

      const hint = document.getElementById(`hint-${heroId}`);
      if (hint) {
        if (result.levelsGained > 0) {
          hint.textContent = `+${result.levelsGained} ур. (исп. ${result.fragmentsUsed})`;
          row.classList.add('has-result');
        } else {
          hint.textContent = 'Фрагментов недостаточно';
          row.classList.remove('has-result');
        }
      }
    });
  });
}

function renderResults(resultsR, resultsSR, resultsSSR, heroSpecificResults) {
  document.getElementById('totalR').textContent   = resultsR.totalUsed;
  document.getElementById('totalSR').textContent  = resultsSR.totalUsed;
  document.getElementById('totalSSR').textContent = resultsSSR.totalUsed;

  const allAllocations = [
    ...heroSpecificResults.map(r => ({ ...r, source: 'specific' })),
    ...resultsR.perHero.map(r   => ({ ...r, rarity: 'R',   source: 'universal' })),
    ...resultsSR.perHero.map(r  => ({ ...r, rarity: 'SR',  source: 'universal' })),
    ...resultsSSR.perHero.map(r => ({ ...r, rarity: 'SSR', source: 'universal' }))
  ].filter(r => r.levelsGained > 0 || r.allocated > 0);

  const list = document.getElementById('allocationList');
  if (!allAllocations.length) {
    list.innerHTML = '<p class="no-result">Нет данных для отображения</p>';
    return;
  }

  let html = '';
  for (const item of allAllocations) {
    const rarityVal = item.rarity || state.heroes.find(h => h.id === item.heroId)?.rarity || '';
    const rc = rarityClass(rarityVal);
    const frType = item.source === 'universal' ? 'унив.' : 'герой';
    const arrow = `${item.fromStars}★${item.fromRank} → ${item.toStars}★${item.toRank}`;

    html += `
      <div class="alloc-item">
        <div>
          <div class="alloc-hero">
            <span class="rarity-badge ${rc}" style="margin-right:6px">${rarityVal}</span>
            ${item.heroName}
          </div>
          <div class="alloc-detail">${arrow} &nbsp;+${item.levelsGained} ур. &nbsp;(${frType})</div>
        </div>
        <div class="alloc-frags ${rc}">${item.allocated} фр.</div>
      </div>`;
  }

  list.innerHTML = html;

  document.querySelectorAll('.hero-row').forEach(row => row.classList.remove('has-result'));
  for (const item of allAllocations) {
    if (item.levelsGained > 0) {
      const row = document.querySelector(`.hero-row[data-hero-id="${item.heroId}"]`);
      if (row) {
        row.classList.add('has-result');
        const hint = document.getElementById(`hint-${item.heroId}`);
        if (hint) hint.textContent = `+${item.levelsGained} ур. (исп. ${item.allocated})`;
      }
    }
  }
}

// ─── Расчёт ───────────────────────────────────────────────

function calculate() {
  if (!state.heroes.length || !Object.keys(state.costsMap).length) {
    showToast('Данные не загружены', 'error');
    return;
  }

  const univR   = Math.max(0, parseInt(document.getElementById('univR').value)   || 0);
  const univSR  = Math.max(0, parseInt(document.getElementById('univSR').value)  || 0);
  const univSSR = Math.max(0, parseInt(document.getElementById('univSSR').value) || 0);

  const heroSpecific = [];
  document.querySelectorAll('.hero-row').forEach(row => {
    const heroId = parseInt(row.dataset.heroId);
    const stars  = Math.max(0, Math.min(9, parseInt(row.querySelector('.stars-input').value) || 0));
    const rank   = Math.max(0, Math.min(5, parseInt(row.querySelector('.rank-input').value)  || 0));
    const frags  = Math.max(0, parseInt(row.querySelector('.frags-input').value) || 0);
    if (frags === 0) return;

    const hero = state.heroes.find(h => h.id === heroId);
    if (!hero) return;

    const result = calcHeroUpgrades(stars, rank, frags);
    if (result.levelsGained > 0) {
      heroSpecific.push({
        heroId,
        heroName: hero.name,
        rarity: hero.rarity,
        allocated: result.fragmentsUsed,
        levelsGained: result.levelsGained,
        fromStars: stars,
        fromRank: rank,
        toStars: result.finalStars,
        toRank: result.finalRank
      });
    }
  });

  const resultsR   = distributeUniversal('R',   univR);
  const resultsSR  = distributeUniversal('SR',  univSR);
  const resultsSSR = distributeUniversal('SSR', univSSR);

  const specificUsedR   = heroSpecific.filter(h => h.rarity === 'R').reduce((s, h) => s + h.allocated, 0);
  const specificUsedSR  = heroSpecific.filter(h => h.rarity === 'SR').reduce((s, h) => s + h.allocated, 0);
  const specificUsedSSR = heroSpecific.filter(h => h.rarity === 'SSR').reduce((s, h) => s + h.allocated, 0);

  resultsR.totalUsed   += specificUsedR;
  resultsSR.totalUsed  += specificUsedSR;
  resultsSSR.totalUsed += specificUsedSSR;

  renderResults(resultsR, resultsSR, resultsSSR, heroSpecific);
}

// ─── API / Сохранение / Загрузка ─────────────────────────

async function loadHeroesData() {
  try {
    const [heroesRes, costsRes] = await Promise.all([
      fetch('/api/heroes'),
      fetch('/api/heroes/fragment-costs')
    ]);
    state.heroes = await heroesRes.json();
    const costsArray = await costsRes.json();
    state.costsMap = buildCostsMap(costsArray);
    renderHeroes();
  } catch (err) {
    document.getElementById('heroesContainer').innerHTML =
      '<p class="no-result">Ошибка загрузки данных</p>';
  }
}

async function loadUserState() {
  if (!state.user) return;
  try {
    const res = await fetch('/api/heroes/state');
    if (!res.ok) return;
    const saved = await res.json();
    for (const entry of saved) {
      const row = document.querySelector(`.hero-row[data-hero-id="${entry.hero_id}"]`);
      if (!row) continue;
      row.querySelector('.stars-input').value = entry.stars;
      row.querySelector('.rank-input').value  = entry.rank;
      row.querySelector('.frags-input').value = entry.fragments;
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
      fragments: parseInt(row.querySelector('.frags-input').value) || 0
    });
  });

  try {
    const res = await fetch('/api/heroes/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entries)
    });
    if (res.ok) {
      showToast('Сохранено', 'success');
    } else {
      const data = await res.json();
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
    row.classList.remove('has-result');
    const heroId = row.dataset.heroId;
    const hint = document.getElementById(`hint-${heroId}`);
    if (hint) hint.textContent = '';
  });
  document.getElementById('univR').value   = 0;
  document.getElementById('univSR').value  = 0;
  document.getElementById('univSSR').value = 0;
  document.getElementById('totalR').textContent   = '—';
  document.getElementById('totalSR').textContent  = '—';
  document.getElementById('totalSSR').textContent = '—';
  document.getElementById('allocationList').innerHTML =
    '<p class="no-result">Нажмите «Рассчитать» чтобы увидеть результат</p>';
}

// ─── Авторизация ──────────────────────────────────────────

function openLoginModal() {
  document.getElementById('userLoginOverlay').style.display = 'flex';
}

function closeLoginModal() {
  document.getElementById('userLoginOverlay').style.display = 'none';
  document.getElementById('userLoginError').textContent = '';
}

function updateAuthUI() {
  const label = document.getElementById('userLabel');
  const btn   = document.getElementById('userAuthBtn');
  if (state.user) {
    label.textContent = state.user.username;
    btn.textContent   = 'Выйти';
  } else {
    label.textContent = 'Гость';
    btn.textContent   = 'Войти';
  }
}

async function checkAuth() {
  try {
    const res = await fetch('/api/users/me');
    if (res.ok) {
      const data = await res.json();
      if (data.user) {
        state.user = data.user;
        updateAuthUI();
        await loadUserState();
      }
    }
  } catch {}
}

// ─── Toast ────────────────────────────────────────────────

function showToast(msg, type = 'success') {
  const t = document.getElementById('fragToast');
  t.textContent = msg;
  t.className = 'toast show ' + (type === 'error' ? 'toast-error' : '');
  setTimeout(() => { t.className = 'toast'; }, 2500);
}

// ─── Частицы ─────────────────────────────────────────────

function initParticles() {
  const container = document.getElementById('particles');
  if (!container) return;
  for (let i = 0; i < 30; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.cssText = `
      left:${Math.random()*100}%;
      top:${Math.random()*100}%;
      animation-delay:${Math.random()*8}s;
      animation-duration:${6+Math.random()*8}s;
      width:${2+Math.random()*3}px;
      height:${2+Math.random()*3}px;
      opacity:${0.1+Math.random()*0.3}
    `;
    container.appendChild(p);
  }
}

// ─── Инициализация ───────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  initParticles();
  await loadHeroesData();
  await checkAuth();

  document.getElementById('calculateBtn').addEventListener('click', calculate);
  document.getElementById('saveStateBtn').addEventListener('click', saveState);
  document.getElementById('resetAllBtn').addEventListener('click', resetAll);

  document.getElementById('userAuthBtn').addEventListener('click', () => {
    if (state.user) {
      fetch('/api/users/logout', { method: 'POST' }).then(() => {
        state.user = null;
        updateAuthUI();
        showToast('Вы вышли из аккаунта');
      });
    } else {
      openLoginModal();
    }
  });

  document.getElementById('userModalClose').addEventListener('click', closeLoginModal);
  document.getElementById('userLoginOverlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeLoginModal();
  });

  document.getElementById('userLoginForm').addEventListener('submit', async e => {
    e.preventDefault();
    const username = document.getElementById('usernameInput').value.trim();
    const password = document.getElementById('userPasswordInput').value;
    const isReg    = document.getElementById('isRegisterCheckbox').checked;
    const errEl    = document.getElementById('userLoginError');
    errEl.textContent = '';

    try {
      const url = isReg ? '/api/users/register' : '/api/users/login';
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) { errEl.textContent = data.error || 'Ошибка'; return; }
      state.user = data.user || { username };
      updateAuthUI();
      closeLoginModal();
      showToast('Вход выполнен');
      await loadUserState();
    } catch {
      errEl.textContent = 'Ошибка сети';
    }
  });
});
