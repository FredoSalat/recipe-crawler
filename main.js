import { PlaywrightCrawler } from "crawlee";
import sqlite3 from "sqlite3";

import { addRecipeToDatabase } from "./database/dbUtilities.js";
import {
  getImage,
  getIngredients,
  getInstructions,
  getRecipeCharacteristics,
  getTitle,
} from "./recipeCrawler/recipeCrawler.js";

const db = new sqlite3.Database("recipe.db");

const enqueuedCategoriesLimit = 1;
const enqueuedRecipesLimit = 5;

const recipeSelector = ".scaling-card-image";
const categorySelector = ".relative > a";

const crawler = new PlaywrightCrawler({
  requestHandler: async ({ page, request, enqueueLinks }) => {
    try {
      if (request.label === "DETAIL") {
        console.log(`Recipe: ${request.url}`);
        const title = await getTitle(page, request.url);
        const imageURL = await getImage(page, request.url);
        const ingredients = await getIngredients(page, request.url);
        const [amount, cookingTime, category] = await getRecipeCharacteristics(
          page,
          request.url
        );
        const cookingInstructions = await getInstructions(page, request.url);

        await addRecipeToDatabase(
          db,
          title,
          imageURL,
          ingredients,
          amount,
          cookingTime,
          category,
          cookingInstructions
        );
      } else if (request.label === "CATEGORY") {
        await page.waitForSelector(recipeSelector);
        await enqueueLinks({
          limit: enqueuedRecipesLimit,
          selector: recipeSelector,
          label: "DETAIL",
        });
        console.log(`Category: ${request.url}`);
      } else {
        await page.waitForSelector(categorySelector);
        await enqueueLinks({
          limit: enqueuedCategoriesLimit,
          selector: categorySelector,
          label: "CATEGORY",
        });
        console.log(`List of categories: ${request.url}`);
      }
    } catch (error) {
      console.error("An error occurred:", error.message);
    }
  },
});

await crawler.run(["https://recept.se/kategorier"]);
