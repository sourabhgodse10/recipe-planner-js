# Recipe Planner JavaScript

A vanilla JavaScript web app to manage recipes, plan meals for the week, and generate a consolidated grocery list.

## Preview

![Recipe Planner UI](./assets/recipe-planner-overview.png)

## Features

- Add, edit, search, and delete recipes
- Toggle light/dark theme from the header
- Manage ingredient rows per recipe
- Plan breakfast/lunch/dinner for each day of the week
- Auto-generate grocery totals from planned meals
- Copy grocery list to clipboard
- Export app data as JSON
- Export all recipes as a cooking-ready HTML guide
- Import recipes in bulk from Excel (`.xlsx/.xls/.csv`)
- Persist recipes and meal plans with `localStorage`

## CRUD Coverage

- Create: Add new recipes and ingredients
- Read: Browse recipe library and meal planner state
- Update: Edit existing recipes and adjust meal plan selections
- Delete: Remove recipes and clear weekly meal plan

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript (no framework)
- Browser `localStorage` for persistence

## Run Locally

1. Open [index.html](/g:/Fresenius/recipe-planner-js/index.html) directly in a browser, or
2. Start a simple static server from the project folder:

```powershell
python -m http.server 5500
```

Then open `http://localhost:5500`.

## Excel Import Format

Use the first sheet with these columns (case-insensitive):

- `Name` or `Recipe Name` (required)
- `Category` (`breakfast`, `lunch`, `dinner`, or `snack`)
- `Servings`
- `Instructions`
- `Ingredients` (required) in this format:
  `IngredientName|Qty|Unit; IngredientName|Qty|Unit`

Example:

- `Chickpea Curry | dinner | 3 | Simmer for 20 minutes | Chickpeas|400|g; Tomato Puree|250|ml; Onion|1|pcs`

Ready-to-use sample file:

- [samples/recipe-import-sample.xlsx](/g:/Fresenius/recipe-planner-js/samples/recipe-import-sample.xlsx)

## Project Structure

- [index.html](/g:/Fresenius/recipe-planner-js/index.html)
- [styles.css](/g:/Fresenius/recipe-planner-js/styles.css)
- [app.js](/g:/Fresenius/recipe-planner-js/app.js)

## Notes

- All data is stored in the browser under key `recipe_planner_state_v1`.
- Clearing browser storage resets the app data.
