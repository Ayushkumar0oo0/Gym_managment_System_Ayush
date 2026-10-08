const recipes = [
  // =========================================================
  // BREAKFAST
  // =========================================================

  {
    id: "poha",
    name: "Simple Poha",
    category: "breakfast",
    prepTime: "15 min",
    difficulty: "Easy",
    budget: "Low",
    vegetarian: true,

    description:
      "A simple, affordable breakfast made with poha, vegetables and basic Indian spices.",

    ingredients: [
      "Poha - 80 g",
      "Onion - 1 small",
      "Potato - 1 small",
      "Green chilli - 1",
      "Peanuts - 10 g",
      "Mustard seeds - 1/2 teaspoon",
      "Turmeric - 1/4 teaspoon",
      "Salt - according to taste",
      "Oil - 1 teaspoon",
      "Lemon juice - 1 teaspoon",
    ],

    steps: [
      "Wash the poha gently and let it rest for 5 minutes.",
      "Heat oil in a pan and add mustard seeds.",
      "Add onion, green chilli and potato.",
      "Cook until the potato becomes soft.",
      "Add turmeric and salt.",
      "Add the soaked poha and mix gently.",
      "Cook for another 2 to 3 minutes.",
      "Add peanuts and lemon juice.",
      "Serve fresh.",
    ],

    tips: [
      "Do not soak poha for too long.",
      "Use less oil if you are following a fat-loss plan.",
      "Add vegetables for more volume and micronutrients.",
    ],
  },

  {
    id: "oats_milk_banana",
    name: "Oats with Milk & Banana",
    category: "breakfast",
    prepTime: "10 min",
    difficulty: "Easy",
    budget: "Low",
    vegetarian: true,

    description:
      "A quick breakfast using oats, milk and banana. Suitable when you need a simple meal before college or work.",

    ingredients: [
      "Oats - 60 g",
      "Milk - 250 ml",
      "Banana - 1",
      "Peanuts or almonds - 10 g",
      "Cinnamon - optional",
    ],

    steps: [
      "Add milk to a pan and bring it to a light simmer.",
      "Add oats.",
      "Cook for 4 to 5 minutes while stirring.",
      "Slice the banana.",
      "Transfer oats to a bowl.",
      "Add banana and nuts on top.",
      "Serve warm.",
    ],

    tips: [
      "For weight gain, you can increase the oats portion.",
      "For fat loss, keep the portion controlled.",
      "Avoid adding unnecessary sugar.",
    ],
  },

  {
    id: "besan_chilla",
    name: "Besan Chilla",
    category: "breakfast",
    prepTime: "15 min",
    difficulty: "Easy",
    budget: "Low",
    vegetarian: true,

    description:
      "Protein-containing Indian breakfast made from gram flour with vegetables.",

    ingredients: [
      "Besan - 70 g",
      "Onion - 1 small",
      "Tomato - 1 small",
      "Green chilli - 1",
      "Coriander - a small handful",
      "Turmeric - 1/4 teaspoon",
      "Salt - according to taste",
      "Water - as required",
      "Oil - 1 teaspoon",
    ],

    steps: [
      "Add besan to a bowl.",
      "Add chopped onion, tomato, chilli and coriander.",
      "Add turmeric and salt.",
      "Add water slowly and make a smooth batter.",
      "Heat a non-stick or lightly greased pan.",
      "Pour the batter and spread it evenly.",
      "Cook both sides until lightly golden.",
      "Serve hot.",
    ],

    tips: [
      "Keep the batter medium-thick.",
      "Add vegetables according to availability.",
      "Use minimal oil if required.",
    ],
  },

  // =========================================================
  // DAL / LEGUMES
  // =========================================================

  {
    id: "moong_dal",
    name: "Simple Moong Dal",
    category: "lunch",
    prepTime: "25 min",
    difficulty: "Easy",
    budget: "Low",
    vegetarian: true,

    description:
      "A simple everyday dal that works well with rice or roti.",

    ingredients: [
      "Moong dal - 80 g",
      "Tomato - 1",
      "Onion - 1 small",
      "Turmeric - 1/4 teaspoon",
      "Cumin - 1/2 teaspoon",
      "Garlic - 2 cloves",
      "Salt - according to taste",
      "Oil - 1 teaspoon",
      "Water - as required",
    ],

    steps: [
      "Wash the moong dal properly.",
      "Cook the dal with water, turmeric and salt until soft.",
      "Heat a small amount of oil in another pan.",
      "Add cumin and garlic.",
      "Add onion and tomato.",
      "Cook until the tomato becomes soft.",
      "Add the cooked dal.",
      "Mix and simmer for a few minutes.",
      "Serve with rice or roti.",
    ],

    tips: [
      "Use less oil for a lighter meal.",
      "You can add spinach or other vegetables.",
      "Keep salt moderate.",
    ],
  },

  {
    id: "masoor_dal",
    name: "Masoor Dal",
    category: "lunch",
    prepTime: "25 min",
    difficulty: "Easy",
    budget: "Low",
    vegetarian: true,

    description:
      "Affordable red lentil preparation suitable for regular home meals.",

    ingredients: [
      "Masoor dal - 80 g",
      "Tomato - 1",
      "Onion - 1 small",
      "Garlic - 2 cloves",
      "Turmeric - 1/4 teaspoon",
      "Cumin - 1/2 teaspoon",
      "Salt - according to taste",
      "Oil - 1 teaspoon",
      "Water - as required",
    ],

    steps: [
      "Wash the masoor dal.",
      "Cook it with water, turmeric and salt.",
      "Prepare a simple onion, tomato and garlic tempering.",
      "Add the cooked dal to the tempering.",
      "Simmer for 3 to 5 minutes.",
      "Serve with rice or roti.",
    ],

    tips: [
      "Masoor dal is inexpensive and easy to prepare.",
      "Add vegetables to increase meal volume.",
    ],
  },

  {
    id: "rajma",
    name: "Home-style Rajma",
    category: "lunch",
    prepTime: "45 min",
    difficulty: "Medium",
    budget: "Low",
    vegetarian: true,

    description:
      "A simple rajma preparation that pairs well with rice.",

    ingredients: [
      "Rajma - 80 g dry",
      "Onion - 1 medium",
      "Tomato - 2",
      "Garlic - 3 cloves",
      "Ginger - small piece",
      "Turmeric - 1/4 teaspoon",
      "Cumin - 1/2 teaspoon",
      "Red chilli powder - according to taste",
      "Salt - according to taste",
      "Oil - 1 to 2 teaspoons",
    ],

    steps: [
      "Soak rajma overnight.",
      "Drain the water and pressure cook the rajma until soft.",
      "Prepare onion, tomato, ginger and garlic masala.",
      "Add turmeric, chilli and salt.",
      "Add cooked rajma.",
      "Add some water and simmer for 10 to 15 minutes.",
      "Serve with rice.",
    ],

    tips: [
      "Soaking helps reduce cooking time.",
      "Cook rajma thoroughly.",
      "Keep the oil moderate.",
    ],
  },

  // =========================================================
  // SATTU
  // =========================================================

  {
    id: "sattu_drink",
    name: "Sattu Drink",
    category: "snack",
    prepTime: "5 min",
    difficulty: "Very Easy",
    budget: "Low",
    vegetarian: true,

    description:
      "An inexpensive traditional drink made with roasted gram flour.",

    ingredients: [
      "Sattu - 40 g",
      "Water - 300 ml",
      "Lemon juice - 1 teaspoon",
      "Roasted cumin powder - 1/4 teaspoon",
      "Black salt - a small amount",
      "Onion - optional",
      "Coriander - optional",
    ],

    steps: [
      "Add sattu to a glass.",
      "Add a small amount of water and mix into a smooth paste.",
      "Add the remaining water.",
      "Add lemon juice, cumin powder and black salt.",
      "Mix thoroughly.",
      "Add chopped onion and coriander if desired.",
      "Drink fresh.",
    ],

    tips: [
      "Do not add large amounts of sugar if you are controlling calories.",
      "Sattu can also be used as a meal/snack ingredient.",
    ],
  },

  // =========================================================
  // EGGS
  // =========================================================

  {
    id: "egg_bhurji",
    name: "Egg Bhurji",
    category: "breakfast",
    prepTime: "10 min",
    difficulty: "Easy",
    budget: "Low",
    vegetarian: false,

    description:
      "Quick scrambled eggs with onion, tomato and basic spices.",

    ingredients: [
      "Eggs - 2",
      "Onion - 1 small",
      "Tomato - 1 small",
      "Green chilli - optional",
      "Coriander - optional",
      "Turmeric - a pinch",
      "Salt - according to taste",
      "Oil - 1 teaspoon",
    ],

    steps: [
      "Crack the eggs into a bowl and beat them.",
      "Heat oil in a pan.",
      "Add onion and chilli.",
      "Add tomato and cook until soft.",
      "Add turmeric and salt.",
      "Pour in the beaten eggs.",
      "Stir continuously until the eggs are cooked.",
      "Add coriander and serve.",
    ],

    tips: [
      "Use less oil if required.",
      "You can add vegetables such as capsicum or spinach.",
    ],
  },

  {
    id: "omelette",
    name: "Simple Omelette",
    category: "breakfast",
    prepTime: "8 min",
    difficulty: "Very Easy",
    budget: "Low",
    vegetarian: false,

    description:
      "Simple protein-rich egg breakfast that requires very little preparation.",

    ingredients: [
      "Eggs - 2",
      "Onion - 1 small",
      "Tomato - 1 small",
      "Green chilli - optional",
      "Coriander - optional",
      "Salt - according to taste",
      "Oil - 1 teaspoon",
    ],

    steps: [
      "Beat the eggs in a bowl.",
      "Add chopped onion, tomato, coriander and salt.",
      "Heat a pan with a small amount of oil.",
      "Pour the egg mixture.",
      "Cook one side.",
      "Flip carefully.",
      "Cook the other side.",
      "Serve immediately.",
    ],

    tips: [
      "Add vegetables for more volume.",
      "Avoid excessive oil.",
    ],
  },

  // =========================================================
  // CHICKEN
  // =========================================================

  {
    id: "chicken_curry",
    name: "Home-style Chicken Curry",
    category: "dinner",
    prepTime: "40 min",
    difficulty: "Medium",
    budget: "Medium",
    vegetarian: false,

    description:
      "A simple home-style chicken curry that can be eaten with rice or roti.",

    ingredients: [
      "Chicken - 200 g",
      "Onion - 1 medium",
      "Tomato - 2",
      "Ginger-garlic paste - 1 teaspoon",
      "Turmeric - 1/2 teaspoon",
      "Cumin - 1/2 teaspoon",
      "Coriander powder - 1 teaspoon",
      "Red chilli powder - according to taste",
      "Salt - according to taste",
      "Mustard or groundnut oil - 1 to 2 teaspoons",
      "Water - as required",
    ],

    steps: [
      "Clean the chicken properly.",
      "Heat oil in a pan.",
      "Add cumin.",
      "Add onion and cook until lightly golden.",
      "Add ginger-garlic paste.",
      "Add tomato and spices.",
      "Cook until the masala becomes soft.",
      "Add chicken and mix well.",
      "Cook for several minutes.",
      "Add water according to the desired gravy.",
      "Cover and cook until the chicken is completely cooked.",
      "Serve with rice or roti.",
    ],

    tips: [
      "Use a moderate amount of oil.",
      "Remove visible excess fat if desired.",
      "Cook chicken thoroughly.",
    ],
  },

  {
    id: "grilled_chicken",
    name: "Simple Grilled Chicken",
    category: "dinner",
    prepTime: "25 min",
    difficulty: "Easy",
    budget: "Medium",
    vegetarian: false,

    description:
      "Simple chicken preparation with basic spices and minimal oil.",

    ingredients: [
      "Chicken breast - 200 g",
      "Curd - 2 tablespoons",
      "Ginger-garlic paste - 1 teaspoon",
      "Turmeric - 1/4 teaspoon",
      "Red chilli powder - according to taste",
      "Cumin powder - 1/2 teaspoon",
      "Lemon juice - 1 teaspoon",
      "Salt - according to taste",
      "Oil - 1 teaspoon",
    ],

    steps: [
      "Mix curd, spices, lemon juice and salt.",
      "Coat the chicken with the mixture.",
      "Allow it to marinate for at least 20 minutes.",
      "Heat a pan or grill.",
      "Add a small amount of oil.",
      "Cook the chicken on both sides.",
      "Continue until completely cooked.",
      "Serve with vegetables or rice.",
    ],

    tips: [
      "Do not burn the outside while leaving the inside undercooked.",
      "Use a food thermometer if available.",
    ],
  },

  // =========================================================
  // FISH
  // =========================================================

  {
    id: "fish_curry",
    name: "Home-style Fish Curry",
    category: "dinner",
    prepTime: "30 min",
    difficulty: "Medium",
    budget: "Medium",
    vegetarian: false,

    description:
      "A simple Indian-style fish curry suitable for lunch or dinner.",

    ingredients: [
      "Fish - 200 g",
      "Onion - 1 medium",
      "Tomato - 1 to 2",
      "Ginger-garlic paste - 1 teaspoon",
      "Turmeric - 1/2 teaspoon",
      "Cumin - 1/2 teaspoon",
      "Coriander powder - 1 teaspoon",
      "Salt - according to taste",
      "Oil - 1 to 2 teaspoons",
      "Water - as required",
    ],

    steps: [
      "Clean the fish properly.",
      "Apply a small amount of turmeric and salt.",
      "Lightly cook the fish in a pan.",
      "Prepare onion, tomato and ginger-garlic masala.",
      "Add cumin and coriander powder.",
      "Add water to create the curry.",
      "Add the fish.",
      "Cook until the fish is completely cooked.",
      "Serve with rice or roti.",
    ],

    tips: [
      "Use fresh fish when possible.",
      "Cook fish thoroughly.",
      "Control oil according to your diet goal.",
    ],
  },

  // =========================================================
  // SOY CHUNKS
  // =========================================================

  {
    id: "soy_chunks_masala",
    name: "Soy Chunks Masala",
    category: "dinner",
    prepTime: "25 min",
    difficulty: "Easy",
    budget: "Low",
    vegetarian: true,

    description:
      "Affordable plant-protein meal using soy chunks and vegetables.",

    ingredients: [
      "Soy chunks - 50 g dry",
      "Onion - 1 medium",
      "Tomato - 1",
      "Ginger-garlic paste - 1 teaspoon",
      "Turmeric - 1/4 teaspoon",
      "Cumin - 1/2 teaspoon",
      "Red chilli powder - according to taste",
      "Salt - according to taste",
      "Oil - 1 teaspoon",
    ],

    steps: [
      "Boil soy chunks in water for several minutes.",
      "Drain and squeeze out excess water.",
      "Heat oil in a pan.",
      "Add cumin and onion.",
      "Add ginger-garlic paste.",
      "Add tomato and spices.",
      "Add soy chunks.",
      "Mix thoroughly.",
      "Cook for 5 to 7 minutes.",
      "Serve with roti or rice.",
    ],

    tips: [
      "Squeeze the soy chunks properly after boiling.",
      "You can add spinach or other vegetables.",
    ],
  },

  // =========================================================
  // PANEER
  // =========================================================

  {
    id: "paneer_bhurji",
    name: "Paneer Bhurji",
    category: "dinner",
    prepTime: "15 min",
    difficulty: "Easy",
    budget: "Medium",
    vegetarian: true,

    description:
      "Simple crumbled paneer preparation with onion, tomato and spices.",

    ingredients: [
      "Paneer - 100 g",
      "Onion - 1 small",
      "Tomato - 1",
      "Capsicum - optional",
      "Green chilli - optional",
      "Turmeric - 1/4 teaspoon",
      "Cumin - 1/2 teaspoon",
      "Salt - according to taste",
      "Oil - 1 teaspoon",
    ],

    steps: [
      "Crumble the paneer.",
      "Heat oil in a pan.",
      "Add cumin.",
      "Add onion and cook lightly.",
      "Add tomato and capsicum.",
      "Add turmeric and salt.",
      "Add crumbled paneer.",
      "Mix and cook for 3 to 5 minutes.",
      "Serve with roti.",
    ],

    tips: [
      "Low-fat paneer can be used when available.",
      "Avoid cooking paneer for too long.",
    ],
  },

  // =========================================================
  // KHICHDI
  // =========================================================

  {
    id: "dal_khichdi",
    name: "Simple Dal Khichdi",
    category: "dinner",
    prepTime: "30 min",
    difficulty: "Easy",
    budget: "Low",
    vegetarian: true,

    description:
      "Comforting rice and dal meal that is easy to cook and budget friendly.",

    ingredients: [
      "Rice - 50 g",
      "Moong dal - 40 g",
      "Carrot - 30 g",
      "Peas - 30 g",
      "Turmeric - 1/4 teaspoon",
      "Cumin - 1/2 teaspoon",
      "Salt - according to taste",
      "Oil - 1 teaspoon",
      "Water - as required",
    ],

    steps: [
      "Wash rice and dal.",
      "Add them to a pressure cooker.",
      "Add vegetables, turmeric and salt.",
      "Add sufficient water.",
      "Cook until soft.",
      "Prepare a light cumin tempering if desired.",
      "Mix and serve warm.",
    ],

    tips: [
      "Adjust water according to the desired consistency.",
      "Add vegetables for extra variety.",
    ],
  },

  // =========================================================
  // SNACKS
  // =========================================================

  {
    id: "roasted_peanuts",
    name: "Roasted Peanuts",
    category: "snack",
    prepTime: "5 min",
    difficulty: "Very Easy",
    budget: "Low",
    vegetarian: true,

    description:
      "Simple inexpensive snack that requires almost no preparation.",

    ingredients: [
      "Peanuts - 30 g",
      "Black salt - optional",
      "Roasted cumin powder - optional",
    ],

    steps: [
      "Dry roast peanuts in a pan if they are not already roasted.",
      "Allow them to cool.",
      "Add a small amount of black salt if desired.",
      "Serve.",
    ],

    tips: [
      "Keep the serving controlled because peanuts are calorie dense.",
    ],
  },

  {
    id: "curd_fruit_bowl",
    name: "Curd Fruit Bowl",
    category: "snack",
    prepTime: "5 min",
    difficulty: "Very Easy",
    budget: "Low",
    vegetarian: true,

    description:
      "Quick snack combining curd and fresh fruit.",

    ingredients: [
      "Curd - 150 g",
      "Banana or apple - 1",
      "Flax seeds - 5 g",
      "Cinnamon - optional",
    ],

    steps: [
      "Add curd to a bowl.",
      "Cut the fruit into small pieces.",
      "Add fruit to the curd.",
      "Add flax seeds.",
      "Mix and serve fresh.",
    ],

    tips: [
      "Avoid adding unnecessary sugar.",
      "Use seasonal fruits to reduce cost.",
    ],
  },

  // =========================================================
  // SIMPLE RICE
  // =========================================================

  {
    id: "plain_rice",
    name: "Plain Rice",
    category: "lunch",
    prepTime: "20 min",
    difficulty: "Very Easy",
    budget: "Low",
    vegetarian: true,

    description:
      "Basic cooked rice that can be paired with dal, vegetables, chicken or fish.",

    ingredients: [
      "Rice - 100 g",
      "Water - as required",
      "Salt - optional",
    ],

    steps: [
      "Wash the rice thoroughly.",
      "Add rice and water to a pot or cooker.",
      "Cook until the rice becomes soft.",
      "Drain excess water if required.",
      "Serve hot.",
    ],

    tips: [
      "Measure your portion according to your diet plan.",
      "Pair rice with a protein source and vegetables.",
    ],
  },

  // =========================================================
  // ROTI
  // =========================================================

  {
    id: "roti",
    name: "Simple Roti",
    category: "lunch",
    prepTime: "20 min",
    difficulty: "Easy",
    budget: "Low",
    vegetarian: true,

    description:
      "Basic whole-wheat roti for everyday meals.",

    ingredients: [
      "Whole wheat flour - 30 g per roti",
      "Water - as required",
      "Dry flour - for rolling",
    ],

    steps: [
      "Add wheat flour to a bowl.",
      "Add water gradually and knead into a soft dough.",
      "Rest the dough for 10 minutes.",
      "Divide into small portions.",
      "Roll each portion into a thin round.",
      "Cook on a hot tawa.",
      "Flip and cook both sides.",
      "Serve hot.",
    ],

    tips: [
      "Avoid adding excess oil or ghee if calories are being controlled.",
      "The portion in your diet plan matters more than making the roti very large.",
    ],
  },
];

export default recipes;