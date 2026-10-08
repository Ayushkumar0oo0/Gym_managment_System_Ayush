const FOOD_RECIPE_MAP = {
  // Breakfast
  oats: "oats_milk_banana",
  poha: "poha",
  besan_chilla: "besan_chilla",
  sattu: "sattu_drink",
  idli: null,
  plain_dosa: null,
  dalia: null,

  // Eggs
  whole_egg: "omelette",
  egg_bhurji: "egg_bhurji",
  omelette: "omelette",

  // Dairy
  milk: null,
  curd: "curd_fruit_bowl",
  paneer: "paneer_bhurji",
  low_fat_paneer: "paneer_bhurji",

  // Dal / legumes
  toor_dal: "moong_dal",
  moong_dal: "moong_dal",
  masoor_dal: "masoor_dal",
  urad_dal: null,
  chana_dal: null,
  mixed_dal: "moong_dal",
  rajma: "rajma",
  black_chana: null,
  kabuli_chana: null,
  soy_chunks: "soy_chunks_masala",

  // Chicken
  chicken_breast: "grilled_chicken",
  chicken_curry: "chicken_curry",
  home_style_chicken_curry: "chicken_curry",
  grilled_chicken: "grilled_chicken",

  // Fish
  rohu_fish: "fish_curry",
  katla_fish: "fish_curry",
  fish_curry: "fish_curry",

  // Carbohydrates
  white_rice: "plain_rice",
  brown_rice: "plain_rice",
  roti: "roti",
  multigrain_roti: "roti",
  khichdi: "dal_khichdi",

  // Fruits
  banana: "oats_milk_banana",
  apple: null,
  guava: null,
  papaya: null,

  // Snacks
  peanuts: "roasted_peanuts",

  // Drinks
  lemon_water: null,
  coconut_water: null,
};

export function getRecipeId(foodId) {
  if (!foodId) {
    return null;
  }

  return FOOD_RECIPE_MAP[foodId] || null;
}

export default FOOD_RECIPE_MAP;