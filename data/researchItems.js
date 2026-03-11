// Справочник пунктов исследований для заполнения таблицы research_items.
// Структура объекта:
// {
//   code: 'R1',              // уникальный код (может совпадать с кодом из Excel/игры)
//   name: 'Название пункта', // человекочитаемое имя
//   maxLevel: 10,            // максимальный уровень
//   powerPerLevel: 100,      // прибавка силы за 1 уровень
//   timeMinutes: 60          // время на 1 уровень в минутах
// }

const RESEARCH_ITEMS = [
  // Развитие
  { code: 'DEV_FAST_BUILD_1', name: 'Быстрое строительство 1', maxLevel: 5, powerPerLevel: 0, timeMinutes: 1 },
  { code: 'DEV_HOSPITAL_EXP_1', name: 'Расширение госпиталя 1', maxLevel: 5, powerPerLevel: 0, timeMinutes: 1 },
  { code: 'DEV_BARRACKS_EXP_1', name: 'Расширение казарм 1', maxLevel: 5, powerPerLevel: 0, timeMinutes: 1 },
  { code: 'DEV_RESEARCH_BOOST_1', name: 'Усиление исследования 1', maxLevel: 5, powerPerLevel: 0, timeMinutes: 1 },
  { code: 'DEV_FIRST_AID_1', name: 'Первая помощь 1', maxLevel: 5, powerPerLevel: 0, timeMinutes: 1 },
  { code: 'DEV_INTENSIVE_TRAINING_1', name: 'Интенсивное обучение 1', maxLevel: 5, powerPerLevel: 0, timeMinutes: 1 },
  { code: 'DEV_ALLIANCE_CONSTRUCTION', name: 'Строительство союза', maxLevel: 5, powerPerLevel: 0, timeMinutes: 1 },
  { code: 'DEV_FAST_BUILD_2', name: 'Быстрое строительство 2', maxLevel: 5, powerPerLevel: 0, timeMinutes: 1 },
  { code: 'DEV_HOSPITAL_EXP_2', name: 'Расширение госпиталя 2', maxLevel: 5, powerPerLevel: 0, timeMinutes: 1 },
  { code: 'DEV_BARRACKS_EXP_2', name: 'Расширение казарм 2', maxLevel: 5, powerPerLevel: 0, timeMinutes: 1 },
  { code: 'DEV_RESEARCH_BOOST_2', name: 'Усиление исследования 2', maxLevel: 5, powerPerLevel: 0, timeMinutes: 1 },
  { code: 'DEV_FIRST_AID_2', name: 'Первая помощь 2', maxLevel: 5, powerPerLevel: 0, timeMinutes: 1 },
  { code: 'DEV_INTENSIVE_TRAINING_2', name: 'Интенсивное обучение 2', maxLevel: 5, powerPerLevel: 0, timeMinutes: 1 },
  { code: 'DEV_ALLIANCE_RESEARCH', name: 'Исследование союза', maxLevel: 5, powerPerLevel: 0, timeMinutes: 1 },
  { code: 'DEV_FAST_BUILD_3', name: 'Быстрое строительство 3', maxLevel: 5, powerPerLevel: 0, timeMinutes: 1 },
  { code: 'DEV_HOSPITAL_EXP_3', name: 'Расширение госпиталя 3', maxLevel: 5, powerPerLevel: 0, timeMinutes: 1 },
  { code: 'DEV_BARRACKS_EXP_3', name: 'Расширение казарм 3', maxLevel: 5, powerPerLevel: 0, timeMinutes: 1 },
  { code: 'DEV_RESEARCH_BOOST_3', name: 'Усиление исследования 3', maxLevel: 5, powerPerLevel: 0, timeMinutes: 1 },
  { code: 'DEV_FIRST_AID_3', name: 'Первая помощь 3', maxLevel: 5, powerPerLevel: 0, timeMinutes: 1 },
  { code: 'DEV_INTENSIVE_TRAINING_3', name: 'Интенсивное обучение 3', maxLevel: 5, powerPerLevel: 0, timeMinutes: 1 },
  { code: 'DEV_EFFECTIVE_TREATMENT', name: 'Эффективное лечение', maxLevel: 5, powerPerLevel: 0, timeMinutes: 1 },
  { code: 'DEV_FAST_BUILD_4', name: 'Быстрое строительство 4', maxLevel: 5, powerPerLevel: 0, timeMinutes: 1 },
  { code: 'DEV_HOSPITAL_EXP_4', name: 'Расширение госпиталя 4', maxLevel: 5, powerPerLevel: 0, timeMinutes: 1 },
  { code: 'DEV_BARRACKS_EXP_4', name: 'Расширение казарм 4', maxLevel: 5, powerPerLevel: 0, timeMinutes: 1 },
  { code: 'DEV_RESEARCH_BOOST_4', name: 'Усиление исследования 4', maxLevel: 5, powerPerLevel: 0, timeMinutes: 1 },
  { code: 'DEV_FIRST_AID_4', name: 'Первая помощь 4', maxLevel: 5, powerPerLevel: 0, timeMinutes: 1 },
  { code: 'DEV_INTENSIVE_TRAINING_4', name: 'Интенсивное обучение 4', maxLevel: 5, powerPerLevel: 0, timeMinutes: 1 },
  { code: 'DEV_EFFECTIVE_TRAINING', name: 'Эффективное обучение', maxLevel: 5, powerPerLevel: 0, timeMinutes: 1 },
  { code: 'DEV_GARRISON_EXP', name: 'Расширение гарнизона', maxLevel: 5, powerPerLevel: 0, timeMinutes: 1 },
  { code: 'DEV_SURVIVAL_LESSONS', name: 'Уроки выживания', maxLevel: 5, powerPerLevel: 0, timeMinutes: 1 },

  // Экономика
  { code: 'ECO_FOOD_PROD_1', name: 'Производство еды 1', maxLevel: 5, powerPerLevel: 0, timeMinutes: 1 },
  { code: 'ECO_WOOD_PROD_1', name: 'Производство древесины 1', maxLevel: 5, powerPerLevel: 0, timeMinutes: 1 },
  { code: 'ECO_METAL_PROD_1', name: 'Производство металла 1', maxLevel: 5, powerPerLevel: 0, timeMinutes: 1 },
  { code: 'ECO_FOOD_GATH_1', name: 'Заготовка еды 1', maxLevel: 5, powerPerLevel: 0, timeMinutes: 1 },
  { code: 'ECO_WOOD_GATH_1', name: 'Заготовка древесины 1', maxLevel: 5, powerPerLevel: 0, timeMinutes: 1 },
  { code: 'ECO_METAL_GATH_1', name: 'Заготовка металла 1', maxLevel: 5, powerPerLevel: 0, timeMinutes: 1 },
  { code: 'ECO_FOOD_PROD_2', name: 'Производство еды 2', maxLevel: 5, powerPerLevel: 0, timeMinutes: 1 },
  { code: 'ECO_WOOD_PROD_2', name: 'Производство древесины 2', maxLevel: 5, powerPerLevel: 0, timeMinutes: 1 },
  { code: 'ECO_ALLIANCE_SILVER_1', name: 'Серебро союза 1', maxLevel: 5, powerPerLevel: 0, timeMinutes: 1 },
  { code: 'ECO_FUEL_PROD_1', name: 'Производство топлива 1', maxLevel: 5, powerPerLevel: 0, timeMinutes: 1 },
  { code: 'ECO_FOOD_GATH_2', name: 'Заготовка еды 2', maxLevel: 5, powerPerLevel: 0, timeMinutes: 1 },
  { code: 'ECO_WOOD_GATH_2', name: 'Заготовка древесины 2', maxLevel: 5, powerPerLevel: 0, timeMinutes: 1 },
  { code: 'ECO_FUEL_GATH_1', name: 'Заготовка топлива 1', maxLevel: 5, powerPerLevel: 0, timeMinutes: 1 },
  { code: 'ECO_FOOD_PROD_3', name: 'Производство еды 3', maxLevel: 5, powerPerLevel: 0, timeMinutes: 1 },
  { code: 'ECO_METAL_PROD_2', name: 'Производство металла 2', maxLevel: 5, powerPerLevel: 0, timeMinutes: 1 },
  { code: 'ECO_WOOD_PROD_3', name: 'Производство древесины 3', maxLevel: 5, powerPerLevel: 0, timeMinutes: 1 },
  { code: 'ECO_ALLIANCE_SILVER_2', name: 'Серебро союза 2', maxLevel: 5, powerPerLevel: 0, timeMinutes: 1 },
  { code: 'ECO_FUEL_PROD_2', name: 'Производство топлива 2', maxLevel: 5, powerPerLevel: 0, timeMinutes: 1 },
  { code: 'ECO_FOOD_GATH_3', name: 'Заготовка еды 3', maxLevel: 5, powerPerLevel: 0, timeMinutes: 1 },
  { code: 'ECO_METAL_GATH_2', name: 'Заготовка металла 2', maxLevel: 5, powerPerLevel: 0, timeMinutes: 1 },
  { code: 'ECO_WOOD_GATH_3', name: 'Заготовка древесины 3', maxLevel: 5, powerPerLevel: 0, timeMinutes: 1 },
  { code: 'ECO_FUEL_GATH_2', name: 'Заготовка топлива 2', maxLevel: 5, powerPerLevel: 0, timeMinutes: 1 },
  { code: 'ECO_FOOD_PROD_4', name: 'Производство еды 4', maxLevel: 5, powerPerLevel: 0, timeMinutes: 1 },
  { code: 'ECO_METAL_PROD_3', name: 'Производство металла 3', maxLevel: 5, powerPerLevel: 0, timeMinutes: 1 },
  { code: 'ECO_WOOD_PROD_4', name: 'Производство древесины 4', maxLevel: 5, powerPerLevel: 0, timeMinutes: 1 },
  { code: 'ECO_ALLIANCE_SILVER_3', name: 'Серебро союза 3', maxLevel: 5, powerPerLevel: 0, timeMinutes: 1 },
  { code: 'ECO_FUEL_PROD_3', name: 'Производство топлива 3', maxLevel: 5, powerPerLevel: 0, timeMinutes: 1 },
  { code: 'ECO_FOOD_GATH_4', name: 'Заготовка еды 4', maxLevel: 5, powerPerLevel: 0, timeMinutes: 1 },
  { code: 'ECO_METAL_GATH_3', name: 'Заготовка металла 3', maxLevel: 5, powerPerLevel: 0, timeMinutes: 1 },
  { code: 'ECO_WOOD_GATH_4', name: 'Заготовка древесины 4', maxLevel: 5, powerPerLevel: 0, timeMinutes: 1 },
  { code: 'ECO_FUEL_GATH_3', name: 'Заготовка топлива 3', maxLevel: 5, powerPerLevel: 0, timeMinutes: 1 },
  { code: 'ECO_ALLIANCE_SILVER_4', name: 'Серебро союза 4', maxLevel: 5, powerPerLevel: 0, timeMinutes: 1 },
  { code: 'ECO_RESOURCE_PROD', name: 'Производство ресурсов', maxLevel: 5, powerPerLevel: 0, timeMinutes: 1 },
  { code: 'ECO_RESOURCE_TRANSPORT', name: 'Транспортировка ресурсов', maxLevel: 5, powerPerLevel: 0, timeMinutes: 1 },

  // Герои (часть, аналогично можно продолжить остальные строки)
  { code: 'HERO_GUARD_HP_1', name: 'Герои-стражи: бонус к здоровью 1', maxLevel: 5, powerPerLevel: 0, timeMinutes: 1 },
  { code: 'HERO_GUARD_ATK_1', name: 'Герои-стражи: бонус к атаке 1', maxLevel: 5, powerPerLevel: 0, timeMinutes: 1 },
  { code: 'HERO_GUARD_DEF_1', name: 'Герои-стражи: бонус к обороне 1', maxLevel: 5, powerPerLevel: 0, timeMinutes: 1 },
  { code: 'HERO_GUARD_DMG', name: 'Герои-стражи: бонус к урону', maxLevel: 1, powerPerLevel: 0, timeMinutes: 1 },
  { code: 'HERO_ARCHER_HP_1', name: 'Герои-стрелки: бонус к здоровью 1', maxLevel: 5, powerPerLevel: 0, timeMinutes: 1 },
  { code: 'HERO_ARCHER_ATK_1', name: 'Герои-стрелки: бонус к атаке 1', maxLevel: 5, powerPerLevel: 0, timeMinutes: 1 },
  { code: 'HERO_ARCHER_DEF_1', name: 'Герои-стрелки: бонус к обороне 1', maxLevel: 5, powerPerLevel: 0, timeMinutes: 1 },
  { code: 'HERO_ARCHER_DMG', name: 'Герои-стрелки: бонус к урону', maxLevel: 1, powerPerLevel: 0, timeMinutes: 1 },
  { code: 'HERO_SNIPER_HP_1', name: 'Герои-снайперы: бонус к здоровью 1', maxLevel: 5, powerPerLevel: 0, timeMinutes: 1 },
  { code: 'HERO_SNIPER_ATK_1', name: 'Герои-снайперы: бонус к атаке 1', maxLevel: 5, powerPerLevel: 0, timeMinutes: 1 },
  { code: 'HERO_SNIPER_DEF_1', name: 'Герои-снайперы: бонус к обороне 1', maxLevel: 5, powerPerLevel: 0, timeMinutes: 1 },
  { code: 'HERO_SNIPER_DMG', name: 'Герои-снайперы: бонус к урону', maxLevel: 1, powerPerLevel: 0, timeMinutes: 1 }

  // Остальные строки из 1.txt можно аналогично продолжить при необходимости
];

module.exports = { RESEARCH_ITEMS };

