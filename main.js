import { PlaywrightCrawler } from "crawlee";
import sqlite3 from "sqlite3";

import { addRecipeToDatabase } from "./database/dbUtilities.js";
import {
  getImage,
  getIngredients,
  getTitle,
} from "./recipeCrawler/recipeCrawler.js";

const db = new sqlite3.Database("recipe.db");

const loadedCategoriesLimit = 1;
const loadedRecipeLimit = 45;

const recipeSelector = ".scaling-card-image";
const nextButton = "";
const categorySelector = ".relative > a";

const crawler = new PlaywrightCrawler({
  requestHandler: async ({ page, request, enqueueLinks }) => {
    try {
      if (request.label === "DETAIL") {
        console.log(`Recipe: ${request.url}`);
        const title = await getTitle(page, request.url);
        const imageURL = await getImage(page, request.url);
        const ingredients = await getIngredients(page, request.url);
        await addRecipeToDatabase(db, title, imageURL, ingredients);
      } else if (request.label === "CATEGORY") {
        // Queues each recipe within every category

        await page.waitForSelector(recipeSelector);
        await enqueueLinks({
          limit: loadedRecipeLimit,
          selector: recipeSelector,
          label: "DETAIL",
        });

        // Paginates through all recipe pages
        const nextButton = await page.$(nextButton);

        if (nextButton) {
          await enqueueLinks({
            selector: nextButton,
            label: "CATEGORY",
          });
          console.log("Next button clicked");
        }
        console.log(`Category: ${request.url}`);
      } else {
        // Queues all categories on the category page
        await page.waitForSelector(categorySelector);

        await enqueueLinks({
          limit: loadedCategoriesLimit,
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
