import foods from "@/lib/diet/foods";
import { getRecipeId } from "@/lib/diet/recipeMap";

/*
|--------------------------------------------------------------------------
| DIET GENERATOR
|--------------------------------------------------------------------------
|
| All food nutrition values come from foods.js.
|
| foods.js defines:
|
|   gram  → nutrition per 100 g
|   piece → nutrition per 1 piece
|   ml    → nutrition per the defined serving size
|
| The generator converts portions correctly before calculating
| calories, protein, carbs and fats.
|
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| GOAL SETTINGS
|--------------------------------------------------------------------------
*/

const GOAL_SETTINGS = {
  weight_gain: {
    calorieAdjustment: 350,
    proteinPerKg: 1.6,
    phaseName: "Weight Gain",
  },

  muscle_gain: {
    calorieAdjustment: 250,
    proteinPerKg: 1.7,
    phaseName: "Muscle Gain",
  },

  fat_loss: {
    calorieAdjustment: -350,
    proteinPerKg: 1.8,
    phaseName: "Fat Loss",
  },

  maintenance: {
    calorieAdjustment: 0,
    proteinPerKg: 1.5,
    phaseName: "Maintenance",
  },

  general_fitness: {
    calorieAdjustment: 100,
    proteinPerKg: 1.4,
    phaseName: "General Fitness",
  },
};

/*
|--------------------------------------------------------------------------
| ACTIVITY MULTIPLIER
|--------------------------------------------------------------------------
*/

function getActivityMultiplier(workoutDays) {
  const days = Number(workoutDays) || 0;

  if (days <= 1) {
    return 1.25;
  }

  if (days <= 3) {
    return 1.4;
  }

  if (days <= 5) {
    return 1.55;
  }

  if (days <= 6) {
    return 1.7;
  }

  return 1.8;
}

/*
|--------------------------------------------------------------------------
| BASIC HELPERS
|--------------------------------------------------------------------------
*/

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function round(value, decimals = 1) {
  const multiplier = 10 ** decimals;

  return (
    Math.round(Number(value) * multiplier) /
    multiplier
  );
}

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

/*
|--------------------------------------------------------------------------
| BMI
|--------------------------------------------------------------------------
*/

function calculateBMI(weightKg, heightCm) {
  const weight = Number(weightKg);
  const height = Number(heightCm) / 100;

  if (!weight || !height || height <= 0) {
    return null;
  }

  return round(weight / (height * height), 1);
}

/*
|--------------------------------------------------------------------------
| BMR
|--------------------------------------------------------------------------
|
| Mifflin-St Jeor equation.
|
|--------------------------------------------------------------------------
*/

function calculateBMR({
  weightKg,
  heightCm,
  age,
  gender,
}) {
  const weight = Number(weightKg);
  const height = Number(heightCm);
  const ageValue = Number(age);

  if (!weight || !height || !ageValue) {
    return 0;
  }

  const base =
    10 * weight +
    6.25 * height -
    5 * ageValue;

  if (normalizeText(gender) === "female") {
    return base - 161;
  }

  return base + 5;
}

/*
|--------------------------------------------------------------------------
| FOOD FILTERING
|--------------------------------------------------------------------------
*/

function isFoodAllowed(
  food,
  {
    dietType,
    restrictedDays,
    dayName,
  }
) {
  if (!food) {
    return false;
  }

  if (
    dietType === "vegetarian" &&
    food.type === "non_vegetarian"
  ) {
    return false;
  }

  if (
    food.type === "non_vegetarian" &&
    Array.isArray(restrictedDays) &&
    restrictedDays.includes(
      normalizeText(dayName)
    )
  ) {
    return false;
  }

  return true;
}

function getFoods({
  meal,
  dietType,
  restrictedDays,
  dayName,
  categories = [],
  budget = "low",
}) {
  let result = foods.filter(
    (food) =>
      Array.isArray(food.meals) &&
      food.meals.includes(meal) &&
      isFoodAllowed(food, {
        dietType,
        restrictedDays,
        dayName,
      })
  );

  if (categories.length > 0) {
    const categoryFoods = result.filter(
      (food) =>
        categories.includes(food.category)
    );

    if (categoryFoods.length > 0) {
      result = categoryFoods;
    }
  }

  /*
   * Prefer affordable foods.
   */

  const budgetOrder = {
    low: 0,
    medium: 1,
    high: 2,
  };

  const preferredBudget =
    budgetOrder[budget] ?? 0;

  result.sort((a, b) => {
    const aBudget =
      budgetOrder[a.budget] ?? 1;

    const bBudget =
      budgetOrder[b.budget] ?? 1;

    const aDifference = Math.abs(
      aBudget - preferredBudget
    );

    const bDifference = Math.abs(
      bBudget - preferredBudget
    );

    return aDifference - bDifference;
  });

  return result;
}

/*
|--------------------------------------------------------------------------
| FOOD PORTION CALCULATION
|--------------------------------------------------------------------------
|
| The important part:
|
| gram:
|   nutrition is stored per 100 g
|
| piece:
|   nutrition is stored per piece
|
| ml:
|   nutrition is stored for servingSize ml
|
|--------------------------------------------------------------------------
*/

function calculateFoodNutrition(food, quantity) {
  if (!food) {
    return {
      calories: 0,
      protein: 0,
      carbs: 0,
      fats: 0,
    };
  }

  const amount = Number(quantity);

  if (
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    return {
      calories: 0,
      protein: 0,
      carbs: 0,
      fats: 0,
    };
  }

  /*
   * Gram based food.
   *
   * Nutrition is per 100 g.
   */

  if (food.servingUnit === "gram") {
    const multiplier = amount / 100;

    return {
      calories:
        Number(food.calories || 0) *
        multiplier,

      protein:
        Number(food.protein || 0) *
        multiplier,

      carbs:
        Number(food.carbs || 0) *
        multiplier,

      fats:
        Number(food.fats || 0) *
        multiplier,
    };
  }

  /*
   * Piece based food.
   *
   * Nutrition is per one piece unless
   * servingSize defines another piece count.
   */

  if (food.servingUnit === "piece") {
    const baseServing =
      Number(food.servingSize || 1);

    const multiplier =
      amount / baseServing;

    return {
      calories:
        Number(food.calories || 0) *
        multiplier,

      protein:
        Number(food.protein || 0) *
        multiplier,

      carbs:
        Number(food.carbs || 0) *
        multiplier,

      fats:
        Number(food.fats || 0) *
        multiplier,
    };
  }

  /*
   * Millilitre based food.
   *
   * Example:
   *
   * milk:
   * servingSize = 250 ml
   */

  if (food.servingUnit === "ml") {
    const baseServing =
      Number(food.servingSize || 100);

    const multiplier =
      amount / baseServing;

    return {
      calories:
        Number(food.calories || 0) *
        multiplier,

      protein:
        Number(food.protein || 0) *
        multiplier,

      carbs:
        Number(food.carbs || 0) *
        multiplier,

      fats:
        Number(food.fats || 0) *
        multiplier,
    };
  }

  /*
   * Safe fallback.
   */

  return {
    calories:
      Number(food.calories || 0),

    protein:
      Number(food.protein || 0),

    carbs:
      Number(food.carbs || 0),

    fats:
      Number(food.fats || 0),
  };
}

/*
|--------------------------------------------------------------------------
| CREATE FOOD SERVING
|--------------------------------------------------------------------------
*/

function createFoodServing(
  food,
  quantity,
  label = null
) {
  const nutrition =
    calculateFoodNutrition(
      food,
      quantity
    );

  let servingText;

  if (food.servingUnit === "piece") {
    servingText = `${quantity} ${
      quantity === 1
        ? "piece"
        : "pieces"
    }`;
  } else if (
    food.servingUnit === "ml"
  ) {
    servingText = `${quantity} ml`;
  } else {
    servingText = `${Math.round(
      quantity
    )} g`;
  }

  return {
    foodId: food.id,

    /*
     * Recipe mapping.
     *
     * Example:
     * chicken_breast -> grilled_chicken
     * oats -> oats_milk_banana
     * paneer -> paneer_bhurji
     */
    recipeId: getRecipeId(food.id),

    name:
      label || food.name,

    serving: servingText,

    quantity,

    unit: food.servingUnit,

    calories: round(
      nutrition.calories,
      1
    ),

    protein: round(
      nutrition.protein,
      1
    ),

    carbs: round(
      nutrition.carbs,
      1
    ),

    fats: round(
      nutrition.fats,
      1
    ),

    budget: food.budget,

    category: food.category,
  };
}

/*
|--------------------------------------------------------------------------
| GET FOOD
|--------------------------------------------------------------------------
*/

function findFood(id, options = {}) {
  const food = foods.find(
    (item) => item.id === id
  );

  if (!food) {
    return null;
  }

  if (
    options.dietType ||
    options.restrictedDays ||
    options.dayName
  ) {
    if (
      !isFoodAllowed(food, options)
    ) {
      return null;
    }
  }

  return food;
}

/*
|--------------------------------------------------------------------------
| ROTATION
|--------------------------------------------------------------------------
|
| Prevents the same food from appearing every day.
|
|--------------------------------------------------------------------------
*/

function rotateFoods(
  foodList,
  dayIndex,
  count = 1
) {
  if (
    !Array.isArray(foodList) ||
    foodList.length === 0
  ) {
    return [];
  }

  const result = [];

  for (
    let i = 0;
    i < count;
    i++
  ) {
    result.push(
      foodList[
        (dayIndex + i) %
          foodList.length
      ]
    );
  }

  return result;
}

/*
|--------------------------------------------------------------------------
| MEAL BUILDERS
|--------------------------------------------------------------------------
*/

function buildBreakfast({
  dayIndex,
  dietType,
  restrictedDays,
  dayName,
}) {
  const breakfastOptions =
    getFoods({
      meal: "breakfast",
      dietType,
      restrictedDays,
      dayName,
      budget: "low",
    });

  /*
   * Specific affordable breakfast rotation.
   */

  const preferredIds =
    dietType === "vegetarian"
      ? [
          "oats",
          "poha",
          "upma",
          "besan_chilla",
          "idli",
          "dosa",
          "sattu",
        ]
      : [
          "whole_egg",
          "egg_bhurji",
          "omelette",
          "oats",
          "poha",
          "besan_chilla",
          "sattu",
        ];

  const preferredFoods =
    preferredIds
      .map((id) =>
        findFood(id, {
          dietType,
          restrictedDays,
          dayName,
        })
      )
      .filter(Boolean);

  const options =
    preferredFoods.length > 0
      ? preferredFoods
      : breakfastOptions;

  const food =
    options[
      dayIndex % options.length
    ];

  const meal = [];

  if (food) {
    let quantity = 100;

    if (food.servingUnit === "piece") {
      quantity =
        food.id === "whole_egg" ||
        food.id === "egg_bhurji" ||
        food.id === "omelette"
          ? 2
          : 1;
    }

    if (food.servingUnit === "ml") {
      quantity =
        food.servingSize || 250;
    }

    meal.push(
      createFoodServing(
        food,
        quantity
      )
    );
  }

  /*
   * Add fruit or milk on selected days.
   */

  if (dayIndex % 2 === 0) {
    const fruit = findFood(
      [
        "banana",
        "apple",
        "guava",
        "orange",
      ][dayIndex % 4],
      {
        dietType,
        restrictedDays,
        dayName,
      }
    );

    if (fruit) {
      meal.push(
        createFoodServing(
          fruit,
          fruit.servingUnit ===
            "piece"
            ? 1
            : 100
        )
      );
    }
  }

  return {
    name: "Breakfast",
    items: meal,
  };
}

function buildLunch({
  dayIndex,
  dietType,
  restrictedDays,
  dayName,
}) {
  const meals = [];

  const rice = findFood(
    dayIndex % 2 === 0
      ? "white_rice"
      : "brown_rice",
    {
      dietType,
      restrictedDays,
      dayName,
    }
  );

  const roti = findFood(
    "roti",
    {
      dietType,
      restrictedDays,
      dayName,
    }
  );

  /*
   * Rotate rice and roti.
   */

  if (
    dayIndex % 2 === 0 &&
    rice
  ) {
    meals.push(
      createFoodServing(
        rice,
        180
      )
    );
  } else if (roti) {
    meals.push(
      createFoodServing(
        roti,
        2
      )
    );
  }

  /*
   * Protein source.
   */

  const nonVegProteinIds = [
    "chicken_breast",
    "home_style_chicken_curry",
    "rohu",
    "katla",
    "fish_curry",
  ];

  const vegProteinIds = [
    "toor_dal",
    "moong_dal",
    "masoor_dal",
    "rajma",
    "black_chana",
    "soy_chunks",
    "paneer",
  ];

  const proteinIds =
    dietType === "vegetarian"
      ? vegProteinIds
      : nonVegProteinIds;

  let proteinFood = null;

  for (
    let i = 0;
    i < proteinIds.length;
    i++
  ) {
    const candidate =
      findFood(
        proteinIds[
          (dayIndex + i) %
            proteinIds.length
        ],
        {
          dietType,
          restrictedDays,
          dayName,
        }
      );

    if (candidate) {
      proteinFood = candidate;
      break;
    }
  }

  if (proteinFood) {
    let quantity = 150;

    if (
      proteinFood.id ===
        "chicken_breast" ||
      proteinFood.id ===
        "grilled_chicken"
    ) {
      quantity = 120;
    }

    if (
      proteinFood.id ===
      "soy_chunks"
    ) {
      quantity = 50;
    }

    if (
      proteinFood.id === "paneer" ||
      proteinFood.id ===
        "low_fat_paneer"
    ) {
      quantity = 100;
    }

    meals.push(
      createFoodServing(
        proteinFood,
        quantity
      )
    );
  }

  /*
   * Vegetables.
   */

  const vegetableIds = [
    "mixed_vegetables",
    "spinach",
    "cauliflower",
    "cabbage",
    "bhindi",
    "lauki",
  ];

  const vegetable = findFood(
    vegetableIds[
      dayIndex %
        vegetableIds.length
    ],
    {
      dietType,
      restrictedDays,
      dayName,
    }
  );

  if (vegetable) {
    meals.push(
      createFoodServing(
        vegetable,
        150
      )
    );
  }

  return {
    name: "Lunch",
    items: meals,
  };
}

function buildSnack({
  dayIndex,
  dietType,
  restrictedDays,
  dayName,
}) {
  const items = [];

  const fruitIds = [
    "banana",
    "apple",
    "guava",
    "papaya",
    "orange",
    "sweet_lime",
    "watermelon",
  ];

  const fruit = findFood(
    fruitIds[
      dayIndex % fruitIds.length
    ],
    {
      dietType,
      restrictedDays,
      dayName,
    }
  );

  if (fruit) {
    items.push(
      createFoodServing(
        fruit,
        fruit.servingUnit ===
          "piece"
          ? 1
          : 150
      )
    );
  }

  /*
   * Add an affordable protein/fat source.
   */

  const snackProteinIds =
    dietType === "vegetarian"
      ? [
          "peanuts",
          "curd",
          "sattu",
        ]
      : [
          "whole_egg",
          "curd",
          "peanuts",
        ];

  const proteinFood = findFood(
    snackProteinIds[
      dayIndex %
        snackProteinIds.length
    ],
    {
      dietType,
      restrictedDays,
      dayName,
    }
  );

  if (proteinFood) {
    let quantity = 30;

    if (proteinFood.id === "curd") {
      quantity = 150;
    }

    if (
      proteinFood.id ===
      "whole_egg"
    ) {
      quantity = 2;
    }

    if (
      proteinFood.id === "sattu"
    ) {
      quantity = 30;
    }

    items.push(
      createFoodServing(
        proteinFood,
        quantity
      )
    );
  }

  return {
    name: "Evening Snack",
    items,
  };
}

function buildPreWorkout({
  dayIndex,
  dietType,
  restrictedDays,
  dayName,
}) {
  const banana = findFood(
    "banana",
    {
      dietType,
      restrictedDays,
      dayName,
    }
  );

  if (!banana) {
    return {
      name: "Pre-Workout",
      items: [],
    };
  }

  return {
    name: "Pre-Workout",
    items: [
      createFoodServing(
        banana,
        1
      ),
    ],
  };
}

function buildPostWorkout({
  dayIndex,
  dietType,
  restrictedDays,
  dayName,
}) {
  const items = [];

  if (dietType === "vegetarian") {
    const curd = findFood(
      "curd",
      {
        dietType,
        restrictedDays,
        dayName,
      }
    );

    if (curd) {
      items.push(
        createFoodServing(
          curd,
          200
        )
      );
    }

    const milk = findFood(
      "milk",
      {
        dietType,
        restrictedDays,
        dayName,
      }
    );

    if (milk) {
      items.push(
        createFoodServing(
          milk,
          250
        )
      );
    }
  } else {
    const eggs = findFood(
      "whole_egg",
      {
        dietType,
        restrictedDays,
        dayName,
      }
    );

    if (eggs) {
      items.push(
        createFoodServing(
          eggs,
          2
        )
      );
    }
  }

  return {
    name: "Post-Workout",
    items,
  };
}

function buildDinner({
  dayIndex,
  dietType,
  restrictedDays,
  dayName,
}) {
  const items = [];

  /*
   * Rotate roti/rice.
   */

  if (dayIndex % 2 === 0) {
    const roti = findFood(
      "roti",
      {
        dietType,
        restrictedDays,
        dayName,
      }
    );

    if (roti) {
      items.push(
        createFoodServing(
          roti,
          2
        )
      );
    }
  } else {
    const rice = findFood(
      "white_rice",
      {
        dietType,
        restrictedDays,
        dayName,
      }
    );

    if (rice) {
      items.push(
        createFoodServing(
          rice,
          150
        )
      );
    }
  }

  /*
   * Protein.
   */

  const proteinIds =
    dietType === "vegetarian"
      ? [
          "moong_dal",
          "masoor_dal",
          "soy_chunks",
          "paneer",
          "black_chana",
        ]
      : [
          "chicken_breast",
          "home_style_chicken_curry",
          "fish_curry",
          "rohu",
          "katla",
        ];

  let proteinFood = null;

  for (
    let i = 0;
    i < proteinIds.length;
    i++
  ) {
    const candidate =
      findFood(
        proteinIds[
          (dayIndex + i) %
            proteinIds.length
        ],
        {
          dietType,
          restrictedDays,
          dayName,
        }
      );

    if (candidate) {
      proteinFood = candidate;
      break;
    }
  }

  if (proteinFood) {
    let quantity = 120;

    if (
      proteinFood.id ===
      "soy_chunks"
    ) {
      quantity = 50;
    }

    if (
      proteinFood.id === "paneer" ||
      proteinFood.id ===
        "low_fat_paneer"
    ) {
      quantity = 100;
    }

    if (
      proteinFood.category ===
      "dal"
    ) {
      quantity = 150;
    }

    items.push(
      createFoodServing(
        proteinFood,
        quantity
      )
    );
  }

  /*
   * Vegetables.
   */

  const vegetables = [
    "lauki",
    "bhindi",
    "cabbage",
    "cauliflower",
    "spinach",
    "mixed_vegetables",
  ];

  const vegetable = findFood(
    vegetables[
      dayIndex %
        vegetables.length
    ],
    {
      dietType,
      restrictedDays,
      dayName,
    }
  );

  if (vegetable) {
    items.push(
      createFoodServing(
        vegetable,
        150
      )
    );
  }

  return {
    name: "Dinner",
    items,
  };
}

/*
|--------------------------------------------------------------------------
| MEAL TOTALS
|--------------------------------------------------------------------------
*/

function calculateMealTotals(meal) {
  const items =
    Array.isArray(meal?.items)
      ? meal.items
      : [];

  return items.reduce(
    (total, item) => {
      total.calories += Number(
        item.calories || 0
      );

      total.protein += Number(
        item.protein || 0
      );

      total.carbs += Number(
        item.carbs || 0
      );

      total.fats += Number(
        item.fats || 0
      );

      return total;
    },
    {
      calories: 0,
      protein: 0,
      carbs: 0,
      fats: 0,
    }
  );
}

/*
|--------------------------------------------------------------------------
| DAY TOTALS
|--------------------------------------------------------------------------
*/

function calculateDayTotals(meals) {
  return meals.reduce(
    (total, meal) => {
      const mealTotal =
        calculateMealTotals(meal);

      total.calories +=
        mealTotal.calories;

      total.protein +=
        mealTotal.protein;

      total.carbs +=
        mealTotal.carbs;

      total.fats +=
        mealTotal.fats;

      return total;
    },
    {
      calories: 0,
      protein: 0,
      carbs: 0,
      fats: 0,
    }
  );
}

/*
|--------------------------------------------------------------------------
| SCALE A FOOD PORTION
|--------------------------------------------------------------------------
|
| Only gram/ml foods can be scaled continuously.
| Piece foods are rounded to practical whole pieces.
|
|--------------------------------------------------------------------------
*/

function scaleFoodServing(
  serving,
  multiplier
) {
  if (!serving) {
    return serving;
  }

  const safeMultiplier = clamp(
    Number(multiplier) || 1,
    0.5,
    2
  );

  const unit = serving.unit;

  let quantity = Number(
    serving.quantity
  );

  if (unit === "piece") {
    quantity = Math.max(
      1,
      Math.round(
        quantity *
          safeMultiplier
      )
    );
  } else {
    quantity = Math.round(
      quantity *
        safeMultiplier
    );

    /*
     * Keep portions practical.
     */

    if (unit === "gram") {
      quantity = clamp(
        quantity,
        20,
        500
      );
    }

    if (unit === "ml") {
      quantity = clamp(
        quantity,
        50,
        1000
      );
    }
  }

  /*
   * Recalculate nutrition from the
   * original food.
   */

  const food = foods.find(
    (item) =>
      item.id === serving.foodId
  );

  if (!food) {
    return serving;
  }

  const updated =
    createFoodServing(
      food,
      quantity,
      serving.name
    );

  return updated;
}

/*
|--------------------------------------------------------------------------
| SCALE DAY TOWARD TARGET
|--------------------------------------------------------------------------
|
| We don't force the exact calorie target.
| Instead we make a sensible adjustment within
| safe portion boundaries.
|
|--------------------------------------------------------------------------
*/

function adjustDayToTarget(
  day,
  targetCalories
) {
  if (
    !day ||
    !Array.isArray(day.meals) ||
    !targetCalories
  ) {
    return day;
  }

  const totals =
    calculateDayTotals(
      day.meals
    );

  if (totals.calories <= 0) {
    return day;
  }

  const ratio =
    targetCalories /
    totals.calories;

  /*
   * Avoid extreme automatic scaling.
   */

  const multiplier = clamp(
    ratio,
    0.85,
    1.2
  );

  /*
   * Prefer scaling calorie-dense
   * gram/ml foods rather than vegetables.
   */

  const adjustedMeals =
    day.meals.map((meal) => ({
      ...meal,

      items: meal.items.map(
        (item) => {
          if (
            item.category ===
            "vegetable"
          ) {
            return item;
          }

          return scaleFoodServing(
            item,
            multiplier
          );
        }
      ),
    }));

  const adjustedTotals =
    calculateDayTotals(
      adjustedMeals
    );

  return {
    ...day,

    meals: adjustedMeals,

    calories: round(
      adjustedTotals.calories,
      1
    ),

    totalCalories: round(
      adjustedTotals.calories,
      1
    ),

    protein: round(
      adjustedTotals.protein,
      1
    ),

    totalProtein: round(
      adjustedTotals.protein,
      1
    ),

    carbs: round(
      adjustedTotals.carbs,
      1
    ),

    fats: round(
      adjustedTotals.fats,
      1
    ),
  };
}

/*
|--------------------------------------------------------------------------
| PHASE
|--------------------------------------------------------------------------
*/

function getPhase(
  dietStartDate,
  currentPhase
) {
  if (!dietStartDate) {
    return (
      Number(currentPhase) || 1
    );
  }

  const start = new Date(
    dietStartDate
  );

  const now = new Date();

  const elapsedDays =
    Math.max(
      0,
      Math.floor(
        (now.getTime() -
          start.getTime()) /
          (1000 *
            60 *
            60 *
            24)
      )
    );

  if (elapsedDays < 28) {
    return 1;
  }

  if (elapsedDays < 84) {
    return 2;
  }

  return 3;
}

/*
|--------------------------------------------------------------------------
| PHASE NAME
|--------------------------------------------------------------------------
*/

function getPhaseName(
  phase,
  goal
) {
  const goalName =
    GOAL_SETTINGS[goal]
      ?.phaseName ||
    "Fitness";

  if (phase === 1) {
    return `${goalName} - Foundation`;
  }

  if (phase === 2) {
    return `${goalName} - Progress`;
  }

  return `${goalName} - Adaptation`;
}

/*
|--------------------------------------------------------------------------
| PROGRESS ANALYSIS
|--------------------------------------------------------------------------
*/

function analyzeProgress(
  progress,
  goal,
  currentWeight
) {
  if (
    !Array.isArray(progress) ||
    progress.length === 0
  ) {
    return {
      startingWeight:
        currentWeight,

      weightChange: 0,

      progressRecommendation:
        "Start tracking your weight regularly so your diet can be adjusted according to your progress.",
    };
  }

  const sorted = [
    ...progress,
  ].sort(
    (a, b) =>
      new Date(
        a.recordedAt
      ) -
      new Date(
        b.recordedAt
      )
  );

  const first = Number(
    sorted[0]?.weightKg
  );

  const latest = Number(
    sorted[
      sorted.length - 1
    ]?.weightKg
  );

  const weightChange =
    latest - first;

  let recommendation =
    "Your progress is being tracked.";

  if (
    goal === "weight_gain" ||
    goal === "muscle_gain"
  ) {
    if (weightChange < 0) {
      recommendation =
        "Your weight has decreased. Your next diet may need more energy and consistent meals.";
    } else if (weightChange === 0) {
      recommendation =
        "Your weight is relatively stable. Keep following the plan and track your progress.";
    } else {
      recommendation =
        "Your weight is moving upward. Continue monitoring your progress and training.";
    }
  }

  if (goal === "fat_loss") {
    if (weightChange > 0) {
      recommendation =
        "Your weight has increased. Your next diet may need closer calorie and portion review.";
    } else if (weightChange === 0) {
      recommendation =
        "Your weight is relatively stable. Keep tracking before making major changes.";
    } else {
      recommendation =
        "Your weight is moving downward. Continue monitoring your energy and training performance.";
    }
  }

  if (goal === "maintenance") {
    if (
      Math.abs(weightChange) <= 1
    ) {
      recommendation =
        "Your weight is relatively stable, which matches your maintenance goal.";
    } else {
      recommendation =
        "Your weight has changed noticeably. Your next plan can adjust portions if needed.";
    }
  }

  return {
    startingWeight: first,

    weightChange: round(
      weightChange,
      1
    ),

    progressRecommendation:
      recommendation,
  };
}

/*
|--------------------------------------------------------------------------
| GENERATE ONE DAY
|--------------------------------------------------------------------------
*/

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

function generateDay({
  dayIndex,
  dayName,
  dietType,
  restrictedDays,
  workoutDays,
}) {
  const breakfast =
    buildBreakfast({
      dayIndex,
      dietType,
      restrictedDays,
      dayName,
    });

  const lunch =
    buildLunch({
      dayIndex,
      dietType,
      restrictedDays,
      dayName,
    });

  const snack =
    buildSnack({
      dayIndex,
      dietType,
      restrictedDays,
      dayName,
    });

  const isWorkoutDay =
    workoutDays > 0 &&
    dayIndex < workoutDays;

  const preWorkout =
    isWorkoutDay
      ? buildPreWorkout({
          dayIndex,
          dietType,
          restrictedDays,
          dayName,
        })
      : null;

  const postWorkout =
    isWorkoutDay
      ? buildPostWorkout({
          dayIndex,
          dietType,
          restrictedDays,
          dayName,
        })
      : null;

  const dinner =
    buildDinner({
      dayIndex,
      dietType,
      restrictedDays,
      dayName,
    });

  const meals = [
    breakfast,
    lunch,
    snack,
  ];

  if (preWorkout) {
    meals.push(preWorkout);
  }

  if (postWorkout) {
    meals.push(postWorkout);
  }

  meals.push(dinner);

  const totals =
    calculateDayTotals(meals);

  return {
    day: dayName,

    meals,

    calories: round(
      totals.calories,
      1
    ),

    totalCalories: round(
      totals.calories,
      1
    ),

    protein: round(
      totals.protein,
      1
    ),

    totalProtein: round(
      totals.protein,
      1
    ),

    carbs: round(
      totals.carbs,
      1
    ),

    fats: round(
      totals.fats,
      1
    ),

    isWorkoutDay,
  };
}

/*
|--------------------------------------------------------------------------
| MAIN GENERATOR
|--------------------------------------------------------------------------
*/

export function generateDietPlan({
  profile,
  progress = [],
}) {
  if (!profile) {
    throw new Error(
      "Diet profile is required."
    );
  }

  const weightKg = Number(
    profile.currentWeightKg
  );

  const heightCm = Number(
    profile.heightCm
  );

  const age = Number(
    profile.age
  );

  const gender = normalizeText(
    profile.gender
  );

  const goal =
    profile.goal ||
    "general_fitness";

  const dietType =
    profile.dietType ||
    "non_vegetarian";

  const restrictedDays =
    Array.isArray(
      profile.restrictedDays
    )
      ? profile.restrictedDays.map(
          normalizeText
        )
      : Array.isArray(
          profile.nonVegRestrictedDays
        )
      ? profile.nonVegRestrictedDays.map(
          normalizeText
        )
      : [];

  const workoutDays = clamp(
    Number(
      profile.workoutDaysPerWeek
    ) || 0,
    0,
    7
  );

  /*
   * -------------------------------------------------------
   * BASIC CALCULATIONS
   * -------------------------------------------------------
   */

  const bmi =
    calculateBMI(
      weightKg,
      heightCm
    );

  const bmr =
    calculateBMR({
      weightKg,
      heightCm,
      age,
      gender,
    });

  const activityMultiplier =
    getActivityMultiplier(
      workoutDays
    );

  const maintenanceCalories =
    bmr * activityMultiplier;

  const settings =
    GOAL_SETTINGS[goal] ||
    GOAL_SETTINGS.general_fitness;

  let targetCalories =
    maintenanceCalories +
    settings.calorieAdjustment;

  /*
   * Reasonable general-purpose bounds.
   */

  targetCalories = clamp(
    targetCalories,
    1400,
    4000
  );

  /*
   * -------------------------------------------------------
   * PROTEIN
   * -------------------------------------------------------
   */

  let targetProtein =
    weightKg *
    settings.proteinPerKg;

  targetProtein = clamp(
    targetProtein,
    60,
    180
  );

  /*
   * -------------------------------------------------------
   * FAT / CARBS
   * -------------------------------------------------------
   */

  const targetFats =
    (targetCalories * 0.25) /
    9;

  const remainingCalories =
    targetCalories -
    targetProtein * 4 -
    targetFats * 9;

  const targetCarbs =
    Math.max(
      100,
      remainingCalories / 4
    );

  /*
   * -------------------------------------------------------
   * PHASE
   * -------------------------------------------------------
   */

  const phase =
    getPhase(
      profile.dietStartDate,
      profile.currentPhase
    );

  const phaseName =
    getPhaseName(
      phase,
      goal
    );

  /*
   * -------------------------------------------------------
   * PROGRESS
   * -------------------------------------------------------
   */

  const progressInfo =
    analyzeProgress(
      progress,
      goal,
      weightKg
    );

  /*
   * -------------------------------------------------------
   * GENERATE 7 DAYS
   * -------------------------------------------------------
   */

  const days = DAYS.map(
    (dayName, dayIndex) => {
      const day =
        generateDay({
          dayIndex,
          dayName,
          dietType,
          restrictedDays,
          workoutDays,
        });

      /*
       * Adjust portions toward target calories.
       */

      return adjustDayToTarget(
        day,
        targetCalories
      );
    }
  );

  /*
   * -------------------------------------------------------
   * DAYS UNTIL REVIEW
   * -------------------------------------------------------
   */

  let daysUntilReview = 28;

  if (profile.dietStartDate) {
    const start = new Date(
      profile.dietStartDate
    );

    const now = new Date();

    const elapsedDays =
      Math.max(
        0,
        Math.floor(
          (now.getTime() -
            start.getTime()) /
            (1000 *
              60 *
              60 *
              24)
        )
      );

    const nextReview =
      phase === 1
        ? 28
        : phase === 2
        ? 84
        : 112;

    daysUntilReview =
      Math.max(
        0,
        nextReview - elapsedDays
      );
  }

  /*
   * -------------------------------------------------------
   * NOTES
   * -------------------------------------------------------
   */

  const notes = [
    "Prefer affordable home-style Indian foods.",
    "Keep water intake consistent throughout the day.",
    "Follow the portions shown in the plan rather than eating unlimited quantities.",
    "Supplements are optional and are not required to follow this diet.",
    "Review your progress regularly before making major changes.",
  ];

  if (
    dietType === "non_vegetarian" &&
    restrictedDays.length > 0
  ) {
    notes.push(
      `Non-vegetarian foods are restricted on: ${restrictedDays.join(
        ", "
      )}.`
    );
  }

  /*
   * -------------------------------------------------------
   * RETURN
   * -------------------------------------------------------
   */

  return {
    generatedAt:
      new Date().toISOString(),

    phase,

    phaseName,

    goal,

    dietType,

    gender,

    age,

    height: heightCm,

    currentWeight: weightKg,

    workoutDays,

    bmi,

    bmr: round(
      bmr,
      1
    ),

    maintenanceCalories:
      round(
        maintenanceCalories,
        1
      ),

    calories: round(
      targetCalories,
      1
    ),

    protein: round(
      targetProtein,
      1
    ),

    carbs: round(
      targetCarbs,
      1
    ),

    fats: round(
      targetFats,
      1
    ),

    startingWeight:
      progressInfo.startingWeight,

    weightChange:
      progressInfo.weightChange,

    progressRecommendation:
      progressInfo.progressRecommendation,

    daysUntilReview,

    restrictedDays,

    days,

    notes,
  };
}

export default generateDietPlan;