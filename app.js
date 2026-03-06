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
    importDataBtn: document.getElementById("import-data-btn"),
    importFileInput: document.getElementById("import-file-input"),
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
    ui.importDataBtn.addEventListener("click", () => ui.importFileInput.click());
    ui.importFileInput.addEventListener("change", importData);
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

  function importData(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || "{}"));
        if (!Array.isArray(parsed.recipes) || typeof parsed.mealPlan !== "object") {
          throw new Error("Invalid file format.");
        }

        state = {
          recipes: parsed.recipes,
          mealPlan: parsed.mealPlan
        };
        ensureMealPlanShape();
        persist();
        resetForm();
        renderRecipeCards();
        renderMealPlan();
        renderGroceryList([]);
        ui.grocerySummary.textContent = "Imported data loaded. Generate list to refresh groceries.";
        showToast("Data imported.");
      } catch {
        showToast("Could not import this file.", true);
      } finally {
        ui.importFileInput.value = "";
      }
    };
    reader.readAsText(file);
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