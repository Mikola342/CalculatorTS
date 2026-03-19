const HEROES_DATA = [
  { name: 'Мэдди',    rarity: 'SSR' },
  { name: 'Рози',     rarity: 'SSR' },
  { name: 'Рэй',      rarity: 'SSR' },
  { name: 'Тарзан',   rarity: 'SSR' },
  { name: 'Никола',   rarity: 'SSR' },
  { name: 'Лайла',    rarity: 'SSR' },
  { name: 'Кэнди',    rarity: 'SSR' },
  { name: 'Райт',     rarity: 'SSR' },
  { name: 'Хирон',    rarity: 'SSR' },
  { name: 'Бэкка',    rarity: 'SSR' },
  { name: 'Тара',     rarity: 'SSR' },
  { name: 'Кики',     rarity: 'SSR' },
  { name: 'Джейкоб',  rarity: 'SSR' },
  { name: 'Тони',     rarity: 'SSR' },
  { name: 'Рагнар',   rarity: 'SSR' },
  { name: 'Акула',    rarity: 'SSR' },
  { name: 'Майк',     rarity: 'SSR' },
  { name: 'Сержант',  rarity: 'SR' },
  { name: 'Повар',    rarity: 'SR' },
  { name: 'Трэвис',   rarity: 'SR' },
  { name: 'Лаки',     rarity: 'SR' },
  { name: 'Фрейя',    rarity: 'SR' },
  { name: 'Ева',      rarity: 'SR' },
  { name: 'Расти',    rarity: 'R' },
  { name: 'Призрак',  rarity: 'R' }
];

// Стоимость фрагментов для достижения каждого уровня (stars, rank)
// null = данный переход недоступен в прогрессии
const FRAGMENT_COSTS_DATA = [
  { stars: 0, rank: 0, cost: 2 },
  { stars: 0, rank: 1, cost: 2 },
  { stars: 0, rank: 2, cost: 2 },
  { stars: 0, rank: 3, cost: 3 },
  { stars: 0, rank: 4, cost: 3 },
  { stars: 0, rank: 5, cost: 3 },

  { stars: 1, rank: 0, cost: 5 },
  { stars: 1, rank: 1, cost: 5 },
  { stars: 1, rank: 2, cost: 5 },
  { stars: 1, rank: 3, cost: 5 },
  { stars: 1, rank: 4, cost: 10 },
  { stars: 1, rank: 5, cost: 10 },

  { stars: 2, rank: 0, cost: 15 },
  { stars: 2, rank: 1, cost: 15 },
  { stars: 2, rank: 2, cost: 15 },
  { stars: 2, rank: 3, cost: 20 },
  { stars: 2, rank: 4, cost: 20 },
  { stars: 2, rank: 5, cost: 20 },

  { stars: 3, rank: 0, cost: 20 },
  { stars: 3, rank: 1, cost: 25 },
  { stars: 3, rank: 2, cost: 25 },
  { stars: 3, rank: 3, cost: 25 },
  { stars: 3, rank: 4, cost: 25 },
  { stars: 3, rank: 5, cost: 25 },

  { stars: 4, rank: 0, cost: null },
  { stars: 4, rank: 1, cost: 30 },
  { stars: 4, rank: 2, cost: 30 },
  { stars: 4, rank: 3, cost: 30 },
  { stars: 4, rank: 4, cost: 30 },
  { stars: 4, rank: 5, cost: null },

  { stars: 5, rank: 0, cost: null },
  { stars: 5, rank: 1, cost: null },
  { stars: 5, rank: 2, cost: 40 },
  { stars: 5, rank: 3, cost: 40 },
  { stars: 5, rank: 4, cost: 40 },
  { stars: 5, rank: 5, cost: 40 },

  { stars: 6, rank: 0, cost: 40 },
  { stars: 6, rank: 1, cost: null },
  { stars: 6, rank: 2, cost: null },
  { stars: 6, rank: 3, cost: null },
  { stars: 6, rank: 4, cost: 45 },
  { stars: 6, rank: 5, cost: null },

  { stars: 7, rank: 0, cost: null },
  { stars: 7, rank: 1, cost: 50 },
  { stars: 7, rank: 2, cost: 50 },
  { stars: 7, rank: 3, cost: 50 },
  { stars: 7, rank: 4, cost: 50 },
  { stars: 7, rank: 5, cost: 50 },

  { stars: 8, rank: 0, cost: null },
  { stars: 8, rank: 1, cost: 55 },
  { stars: 8, rank: 2, cost: 55 },
  { stars: 8, rank: 3, cost: 55 },
  { stars: 8, rank: 4, cost: null },
  { stars: 8, rank: 5, cost: null },

  { stars: 9, rank: 0, cost: null },
  { stars: 9, rank: 1, cost: null },
  { stars: 9, rank: 2, cost: null },
  { stars: 9, rank: 3, cost: null },
  { stars: 9, rank: 4, cost: null },
  { stars: 9, rank: 5, cost: null }
];

module.exports = { HEROES_DATA, FRAGMENT_COSTS_DATA };
