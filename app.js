(() => {
  const STORAGE_KEY = "recipe_planner_state_v1";
  const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const SLOTS = [
    { id: "breakfast", label: "Breakfast" },
    { id: "lunch", label: "Lunch" },
    { id: "dinner", label: "Dinner" }
  ];

  const defaultState = {
    recipes: [
      {
        id: createId(),
        name: "Spinach Omelette",
        category: "breakfast",
        servings: 2,
        instructions: "Whisk eggs, saute spinach, fold and serve.",
        ingredients: [
          { name: "Eggs", qty: 4, unit: "pcs" },
          { name: "Spinach", qty: 120, unit: "g" },
          { name: "Olive oil", qty: 1, unit: "tbsp" }
        ]
      },
      {
        id: createId(),
        name: "Chicken Rice Bowl",
        category: "lunch",
        servings: 2,
        instructions: "Cook rice, grill chicken, assemble with veggies.",
        ingredients: [
          { name: "Chicken breast", qty: 300, unit: "g" },
          { name: "Rice", qty: 180, unit: "g" },
          { name: "Bell pepper", qty: 1, unit: "pcs" }
        ]
      },
      {
        id: createId(),
        name: "Chickpea Curry",
        category: "dinner",
        servings: 3,
        instructions: "Saute onions, add spices and chickpeas, simmer.",
        ingredients: [
          { name: "Chickpeas", qty: 400, unit: "g" },
          { name: "Tomato puree", qty: 250, unit: "ml" },
          { name: "Onion", qty: 1, unit: "pcs" }
        ]
      }
    ],
    mealPlan: createEmptyMealPlan()
  };

  let state = loadState();

  const ui = {
    recipeForm: document.getElementById("recipe-form"),
    formTitle: document.getElementById("recipe-form-title"),
    resetFormBtn: document.getElementById("reset-form-btn"),
    editId: document.getElementById("edit-id"),
    recipeName: document.getElementById("recipe-name"),
    recipeCategory: document.getElementById("recipe-category"),
    recipeServings: document.getElementById("recipe-servings"),
    recipeInstructions: document.getElementById("recipe-instructions"),
    ingredientsList: document.getElementById("ingredients-list"),
    addIngredientBtn: document.getElementById("add-ingredient-btn"),
    recipeList: document.getElementById("recipe-list"),
    recipeSearch: document.getElementById("recipe-search"),
    mealPlanTable: document.getElementById("meal-plan-table"),
    clearWeekBtn: document.getElementById("clear-week-btn"),
    generateListBtn: document.getElementById("generate-list-btn"),
    grocerySummary: document.getElementById("grocery-summary"),
    groceryList: document.getElementById("grocery-list"),
    copyListBtn: document.getElementById("copy-list-btn"),
    exportDataBtn: document.getElementById("export-data-btn"),
    exportCookbookBtn: document.getElementById("export-cookbook-btn"),
    importExcelBtn: document.getElementById("import-excel-btn"),
    importExcelInput: document.getElementById("import-excel-input"),
    toast: document.getElementById("toast")
  };

  init();

  function init() {
    bindEvents();
    ensureMealPlanShape();
    resetForm();
    renderRecipeCards();
    renderMealPlan();
    renderGroceryList([]);
  }

  function bindEvents() {
    ui.addIngredientBtn.addEventListener("click", () => addIngredientRow());
    ui.ingredientsList.addEventListener("click", onIngredientListClick);
    ui.recipeForm.addEventListener("submit", onRecipeSubmit);
    ui.resetFormBtn.addEventListener("click", resetForm);
    ui.recipeSearch.addEventListener("input", renderRecipeCards);
    ui.clearWeekBtn.addEventListener("click", clearWeek);
    ui.mealPlanTable.addEventListener("change", onMealPlanChange);
    ui.generateListBtn.addEventListener("click", generateGroceryList);
    ui.copyListBtn.addEventListener("click", copyGroceryList);
    ui.exportDataBtn.addEventListener("click", exportData);
    ui.exportCookbookBtn.addEventListener("click", exportCookingGuide);
    ui.importExcelBtn.addEventListener("click", () => ui.importExcelInput.click());
    ui.importExcelInput.addEventListener("change", importExcelRecipes);
  }

  function createEmptyMealPlan() {
    return DAYS.reduce((acc, day) => {
      acc[day] = { breakfast: "", lunch: "", dinner: "" };
      return acc;
    }, {});
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return structuredClone(defaultState);
      }
      const parsed = JSON.parse(raw);
      return {
        recipes: Array.isArray(parsed.recipes) ? parsed.recipes : structuredClone(defaultState.recipes),
        mealPlan: typeof parsed.mealPlan === "object" && parsed.mealPlan ? parsed.mealPlan : createEmptyMealPlan()
      };
    } catch {
      return structuredClone(defaultState);
    }
  }

  function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function ensureMealPlanShape() {
    const empty = createEmptyMealPlan();
    DAYS.forEach((day) => {
      if (!state.mealPlan[day]) {
        state.mealPlan[day] = empty[day];
      }
      SLOTS.forEach((slot) => {
        if (typeof state.mealPlan[day][slot.id] !== "string") {
          state.mealPlan[day][slot.id] = "";
        }
      });
    });
    persist();
  }

  function onIngredientListClick(event) {
    const btn = event.target.closest("button[data-action='remove-ingredient']");
    if (!btn) {
      return;
    }
    btn.closest(".ingredient-row")?.remove();
    if (!ui.ingredientsList.children.length) {
      addIngredientRow();
    }
  }

  function addIngredientRow(ingredient = { name: "", qty: "", unit: "" }) {
    const row = document.createElement("div");
    row.className = "ingredient-row";
    row.innerHTML = `
      <input data-field="name" placeholder="Ingredient" value="${escapeHtml(String(ingredient.name || ""))}" required />
      <input data-field="qty" type="number" step="0.01" min="0" placeholder="Qty" value="${escapeHtml(String(ingredient.qty || ""))}" required />
      <input data-field="unit" placeholder="Unit" value="${escapeHtml(String(ingredient.unit || ""))}" />
      <button class="ghost" type="button" data-action="remove-ingredient">Remove</button>
    `;
    ui.ingredientsList.appendChild(row);
  }

  function getRecipeFormData() {
    const name = ui.recipeName.value.trim();
    const category = ui.recipeCategory.value;
    const servings = Math.max(1, Number(ui.recipeServings.value || 1));
    const instructions = ui.recipeInstructions.value.trim();

    const ingredients = Array.from(ui.ingredientsList.querySelectorAll(".ingredient-row"))
      .map((row) => ({
        name: row.querySelector("[data-field='name']")?.value.trim() || "",
        qty: Number(row.querySelector("[data-field='qty']")?.value || 0),
        unit: row.querySelector("[data-field='unit']")?.value.trim() || ""
      }))
      .filter((item) => item.name && item.qty > 0);

    if (!name) {
      throw new Error("Recipe name is required.");
    }

    if (!ingredients.length) {
      throw new Error("Add at least one valid ingredient.");
    }

    return { name, category, servings, instructions, ingredients };
  }

  function onRecipeSubmit(event) {
    event.preventDefault();
    try {
      const data = getRecipeFormData();
      const id = ui.editId.value;
      if (id) {
        const index = state.recipes.findIndex((recipe) => recipe.id === id);
        if (index >= 0) {
          state.recipes[index] = { ...state.recipes[index], ...data };
          showToast("Recipe updated.");
        }
      } else {
        state.recipes.unshift({ id: createId(), ...data });
        showToast("Recipe added.");
      }
      persist();
      resetForm();
      renderRecipeCards();
      renderMealPlan();
    } catch (error) {
      showToast(error.message, true);
    }
  }

  function resetForm() {
    ui.formTitle.textContent = "Add Recipe";
    ui.editId.value = "";
    ui.recipeForm.reset();
    ui.recipeCategory.value = "dinner";
    ui.recipeServings.value = "2";
    ui.ingredientsList.innerHTML = "";
    addIngredientRow();
  }

  function renderRecipeCards() {
    const term = ui.recipeSearch.value.trim().toLowerCase();
    const filtered = state.recipes.filter((recipe) => {
      if (!term) {
        return true;
      }
      return (
        recipe.name.toLowerCase().includes(term) ||
        recipe.category.toLowerCase().includes(term) ||
        recipe.ingredients.some((ingredient) => ingredient.name.toLowerCase().includes(term))
      );
    });

    if (!filtered.length) {
      ui.recipeList.innerHTML = '<div class="empty">No recipes found.</div>';
      return;
    }

    ui.recipeList.innerHTML = filtered
      .map((recipe) => {
        const shortIngredients = recipe.ingredients
          .slice(0, 4)
          .map((ingredient) => `<li>${escapeHtml(ingredient.name)}: ${formatQty(ingredient.qty)} ${escapeHtml(ingredient.unit || "")}</li>`)
          .join("");

        return `
          <article class="recipe-card" data-id="${recipe.id}">
            <h3>${escapeHtml(recipe.name)}</h3>
            <p class="recipe-meta">${capitalize(recipe.category)} • Serves ${recipe.servings}</p>
            <ul class="recipe-ingredients">${shortIngredients}</ul>
            <div class="recipe-actions">
              <button class="ghost" type="button" data-action="edit-recipe">Edit</button>
              <button class="danger" type="button" data-action="delete-recipe">Delete</button>
            </div>
          </article>
        `;
      })
      .join("");

    ui.recipeList.querySelectorAll("button[data-action='edit-recipe']").forEach((btn) => {
      btn.addEventListener("click", () => editRecipe(btn.closest(".recipe-card")?.dataset.id || ""));
    });

    ui.recipeList.querySelectorAll("button[data-action='delete-recipe']").forEach((btn) => {
      btn.addEventListener("click", () => deleteRecipe(btn.closest(".recipe-card")?.dataset.id || ""));
    });
  }

  function editRecipe(id) {
    const recipe = state.recipes.find((item) => item.id === id);
    if (!recipe) {
      return;
    }
    ui.formTitle.textContent = "Edit Recipe";
    ui.editId.value = recipe.id;
    ui.recipeName.value = recipe.name;
    ui.recipeCategory.value = recipe.category;
    ui.recipeServings.value = String(recipe.servings);
    ui.recipeInstructions.value = recipe.instructions || "";
    ui.ingredientsList.innerHTML = "";
    recipe.ingredients.forEach((ingredient) => addIngredientRow(ingredient));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function deleteRecipe(id) {
    const recipe = state.recipes.find((item) => item.id === id);
    if (!recipe) {
      return;
    }
    if (!window.confirm(`Delete recipe "${recipe.name}"?`)) {
      return;
    }

    state.recipes = state.recipes.filter((item) => item.id !== id);
    DAYS.forEach((day) => {
      SLOTS.forEach((slot) => {
        if (state.mealPlan[day][slot.id] === id) {
          state.mealPlan[day][slot.id] = "";
        }
      });
    });
    persist();
    renderRecipeCards();
    renderMealPlan();
    showToast("Recipe deleted.");
  }

  function renderMealPlan() {
    const headerCells = ["Day", ...SLOTS.map((slot) => slot.label)]
      .map((label) => `<th>${label}</th>`)
      .join("");

    const bodyRows = DAYS.map((day) => {
      const cells = SLOTS.map((slot) => {
        const selectedRecipeId = state.mealPlan[day]?.[slot.id] || "";
        const options = [
          '<option value="">None</option>',
          ...state.recipes.map((recipe) => {
            const selected = recipe.id === selectedRecipeId ? "selected" : "";
            return `<option ${selected} value="${recipe.id}">${escapeHtml(recipe.name)}</option>`;
          })
        ].join("");

        return `<td><select data-day="${day}" data-slot="${slot.id}">${options}</select></td>`;
      }).join("");

      return `<tr><th>${day}</th>${cells}</tr>`;
    }).join("");

    ui.mealPlanTable.innerHTML = `
      <thead><tr>${headerCells}</tr></thead>
      <tbody>${bodyRows}</tbody>
    `;
  }

  function onMealPlanChange(event) {
    const select = event.target.closest("select[data-day][data-slot]");
    if (!select) {
      return;
    }
    const day = select.dataset.day;
    const slot = select.dataset.slot;
    state.mealPlan[day][slot] = select.value;
    persist();
  }

  function clearWeek() {
    if (!window.confirm("Clear the full weekly meal plan?")) {
      return;
    }
    state.mealPlan = createEmptyMealPlan();
    persist();
    renderMealPlan();
    renderGroceryList([]);
    showToast("Meal plan cleared.");
  }

  function generateGroceryList() {
    const recipeMap = new Map(state.recipes.map((recipe) => [recipe.id, recipe]));
    const totals = new Map();
    let mealCount = 0;

    DAYS.forEach((day) => {
      SLOTS.forEach((slot) => {
        const recipeId = state.mealPlan[day]?.[slot.id];
        if (!recipeId) {
          return;
        }
        const recipe = recipeMap.get(recipeId);
        if (!recipe) {
          return;
        }
        mealCount += 1;

        recipe.ingredients.forEach((ingredient) => {
          const unit = (ingredient.unit || "").trim().toLowerCase();
          const name = ingredient.name.trim();
          const key = `${name.toLowerCase()}|${unit}`;
          const existing = totals.get(key) || { name, unit, qty: 0 };
          existing.qty += Number(ingredient.qty || 0);
          totals.set(key, existing);
        });
      });
    });

    const list = Array.from(totals.values())
      .filter((item) => item.qty > 0)
      .sort((a, b) => a.name.localeCompare(b.name));

    renderGroceryList(list);
    ui.grocerySummary.textContent = list.length
      ? `Generated ${list.length} grocery items from ${mealCount} planned meals.`
      : "No planned meals found. Add recipes to your weekly plan first.";
  }

  function renderGroceryList(items) {
    if (!items.length) {
      ui.groceryList.innerHTML = "";
      return;
    }

    ui.groceryList.innerHTML = items
      .map((item) => `
        <li class="grocery-item">
          <span>${escapeHtml(item.name)}</span>
          <strong>${formatQty(item.qty)} ${escapeHtml(item.unit)}</strong>
        </li>
      `)
      .join("");
  }

  async function copyGroceryList() {
    const lines = Array.from(ui.groceryList.querySelectorAll(".grocery-item")).map((row) => row.textContent.trim());
    if (!lines.length) {
      showToast("Generate a grocery list first.", true);
      return;
    }

    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      showToast("Grocery list copied.");
    } catch {
      showToast("Clipboard not available in this browser.", true);
    }
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `recipe-planner-backup-${date}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("Data exported.");
  }

  function exportCookingGuide() {
    if (!state.recipes.length) {
      showToast("No recipes available to export.", true);
      return;
    }

    const sortedRecipes = [...state.recipes].sort((a, b) => a.name.localeCompare(b.name));
    const recipeSections = sortedRecipes
      .map((recipe) => {
        const ingredients = recipe.ingredients
          .map((ingredient) => {
            const qty = formatQty(ingredient.qty);
            const unit = ingredient.unit ? ` ${escapeHtml(ingredient.unit)}` : "";
            return `<li><label><input type="checkbox" /> ${escapeHtml(ingredient.name)} - ${qty}${unit}</label></li>`;
          })
          .join("");

        const steps = recipe.instructions
          ? `<p>${escapeHtml(recipe.instructions)}</p>`
          : "<p>No instructions provided.</p>";

        return `
          <section class="recipe">
            <h2>${escapeHtml(recipe.name)}</h2>
            <p class="meta">${capitalize(recipe.category)} | Serves ${recipe.servings}</p>
            <h3>Ingredients</h3>
            <ul>${ingredients}</ul>
            <h3>Instructions</h3>
            ${steps}
          </section>
        `;
      })
      .join("");

    const generatedAt = new Date().toLocaleString();
    const guideHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Recipe Cooking Guide</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 24px; color: #1f2937; line-height: 1.5; }
      h1 { margin: 0 0 6px; }
      .subtitle { color: #4b5563; margin-bottom: 18px; }
      .recipe { border: 1px solid #d1d5db; border-radius: 12px; padding: 16px; margin-bottom: 16px; break-inside: avoid; }
      .meta { color: #374151; margin: 0 0 12px; }
      h2 { margin: 0 0 8px; }
      h3 { margin: 12px 0 8px; }
      ul { padding-left: 18px; margin: 0; }
      li { margin-bottom: 6px; }
      label { cursor: pointer; }
      @media print {
        body { margin: 12mm; }
        .recipe { page-break-inside: avoid; }
      }
    </style>
  </head>
  <body>
    <h1>Recipe Cooking Guide</h1>
    <p class="subtitle">Generated on ${escapeHtml(generatedAt)} | Total recipes: ${sortedRecipes.length}</p>
    ${recipeSections}
  </body>
</html>`;

    const blob = new Blob([guideHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `recipe-cooking-guide-${date}.html`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("Cooking guide exported.");
  }

  function importExcelRecipes(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!window.XLSX) {
      showToast("Excel import library not loaded. Refresh and try again.", true);
      ui.importExcelInput.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const workbook = window.XLSX.read(reader.result, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[firstSheetName];
        if (!sheet) {
          throw new Error("No worksheet found in this file.");
        }

        const rows = window.XLSX.utils.sheet_to_json(sheet, { defval: "" });
        if (!rows.length) {
          throw new Error("Sheet is empty.");
        }

        let added = 0;
        let skipped = 0;

        rows.forEach((row) => {
          const recipe = mapSheetRowToRecipe(row);
          if (!recipe) {
            skipped += 1;
            return;
          }
          state.recipes.unshift({ id: createId(), ...recipe });
          added += 1;
        });

        if (!added) {
          throw new Error("No valid recipes found in sheet.");
        }

        persist();
        renderRecipeCards();
        renderMealPlan();
        renderGroceryList([]);
        ui.grocerySummary.textContent = "Excel import complete. Generate list to refresh groceries.";
        showToast(`Imported ${added} recipe${added === 1 ? "" : "s"}${skipped ? `, skipped ${skipped}` : ""}.`);
      } catch (error) {
        showToast(error.message || "Could not import this Excel file.", true);
      } finally {
        ui.importExcelInput.value = "";
      }
    };
    reader.readAsArrayBuffer(file);
  }

  function mapSheetRowToRecipe(row) {
    if (!row || typeof row !== "object") {
      return null;
    }

    const name = getCellByAliases(row, ["recipe name", "name", "recipe"]).trim();
    if (!name) {
      return null;
    }

    const categoryRaw = getCellByAliases(row, ["category", "meal type", "type"]).toLowerCase();
    const category = ["breakfast", "lunch", "dinner", "snack"].includes(categoryRaw) ? categoryRaw : "dinner";

    const servingsRaw = Number(getCellByAliases(row, ["servings", "serves", "portion", "portions"]));
    const servings = Number.isFinite(servingsRaw) && servingsRaw > 0 ? Math.round(servingsRaw) : 2;

    const instructions = getCellByAliases(row, ["instructions", "steps", "method", "description"]).trim();
    const ingredientsRaw = getCellByAliases(row, ["ingredients", "ingredient list", "items"]);
    const ingredients = parseIngredientsCell(ingredientsRaw);
    if (!ingredients.length) {
      return null;
    }

    return { name, category, servings, instructions, ingredients };
  }

  function parseIngredientsCell(rawValue) {
    return String(rawValue || "")
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const [name = "", qtyText = "", unit = ""] = part.split("|").map((item) => item.trim());
        const qty = Number(qtyText || 1);
        return {
          name,
          qty: Number.isFinite(qty) && qty > 0 ? qty : 1,
          unit
        };
      })
      .filter((ingredient) => ingredient.name);
  }

  function getCellByAliases(row, aliases) {
    const normalizedRow = {};
    Object.entries(row).forEach(([key, value]) => {
      normalizedRow[normalizeCellKey(key)] = value;
    });

    for (const alias of aliases) {
      const value = normalizedRow[normalizeCellKey(alias)];
      if (value === undefined || value === null) {
        continue;
      }
      const text = String(value).trim();
      if (text) {
        return text;
      }
    }
    return "";
  }

  function normalizeCellKey(key) {
    return String(key || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function showToast(message, isError = false) {
    ui.toast.textContent = message;
    ui.toast.style.color = isError ? "var(--danger)" : "var(--accent-2)";
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => {
      ui.toast.textContent = "";
    }, 2600);
  }

  function createId() {
    return `${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;
  }

  function escapeHtml(input) {
    return input
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formatQty(value) {
    const num = Number(value || 0);
    return Number.isInteger(num) ? String(num) : num.toFixed(2).replace(/\.00$/, "");
  }

  function capitalize(text) {
    if (!text) {
      return "";
    }
    return text.charAt(0).toUpperCase() + text.slice(1);
  }
})();
