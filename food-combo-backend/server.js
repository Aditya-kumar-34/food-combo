const express = require("express");
const fs = require("fs");
const cors = require("cors");

const app = express();
const PORT = 5000;

app.use(cors());

const menu = JSON.parse(fs.readFileSync("./menu.json", "utf-8"));
const usedCombos = {};
let globalComboId = 1;

function isPopular(item) {
  return item.popularity_score >= 0.75;
}

function determineTasteProfile(main, side, drink) {
  const tastes = [main.taste_profile, side.taste_profile, drink.taste_profile];
  const uniqueTastes = new Set(tastes);
  return uniqueTastes.size === 1 ? tastes[0] : "Mixed";
}

function getReasoning(taste) {
  if (taste === "spicy") return "Spicy profile fits Friday trends, popular choices, calorie target met";
  if (taste === "savory") return "Savory meal with balanced calories and high popularity";
  if (taste === "sweet") return "Sweet profile suitable for refreshing meal, calorie target achieved";
  return "Mixed taste ensures variety, all items are popular, calorie target met";
}

function getUniqueCombos() {
  const mains = menu.filter(item => item.category === "main" && isPopular(item));
  const sides = menu.filter(item => item.category === "side" && isPopular(item));
  const drinks = menu.filter(item => item.category === "drink" && isPopular(item));

  const combos = [];
  const comboSet = new Set();
  let attempts = 0;

  while (combos.length < 3 && attempts < 1000) {
    const main = mains[Math.floor(Math.random() * mains.length)];
    const side = sides[Math.floor(Math.random() * sides.length)];
    const drink = drinks[Math.floor(Math.random() * drinks.length)];

    const totalCalories = main.calories + side.calories + drink.calories;
    const comboKey = `${main.item_name} + ${side.item_name} + ${drink.item_name}`;

    if (
      totalCalories >= 550 &&
      totalCalories <= 800 &&
      !comboSet.has(comboKey) &&
      !usedCombos[comboKey]
    ) {
      const tasteProfile = determineTasteProfile(main, side, drink);
      const popularityScore = parseFloat(
        ((main.popularity_score + side.popularity_score + drink.popularity_score) / 3).toFixed(2)
      );

      combos.push({
        combo_id: globalComboId++,
        main: main.item_name,
        side: side.item_name,
        drink: drink.item_name,
        total_calories: totalCalories,
        popularity_score: popularityScore,
        taste_profile: tasteProfile,
        reasoning: getReasoning(tasteProfile)
      });

      comboSet.add(comboKey);
      usedCombos[comboKey] = true;
    }

    attempts++;
  }

  return combos;
}

app.get("/api/menu/:day", (req, res) => {
  const combos = getUniqueCombos();
  res.json(combos);
});

app.listen(PORT, () => {
  console.log(`✅ Backend server running at http://localhost:${PORT}`);
});
