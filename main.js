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
const loadedRecipeLimit = 2;

const crawler = new PlaywrightCrawler({
  requestHandler: async ({ page, request, enqueueLinks }) => {
    try {
      if (request.label === "DETAIL") {
        const title = await getTitle(page, request.url);
        const imageURL = await getImage(page, request.url);
        const ingredients = await getIngredients(page, request.url);
        await addRecipeToDatabase(db, title, imageURL, ingredients);
      } else if (request.label === "CATEGORY") {
        // Queues each recipe within every category
        await page.waitForSelector(".u-1\\/2 > a");
        await enqueueLinks({
          limit: loadedRecipeLimit,
          selector: ".u-1\\/2 > a",
          label: "DETAIL",
        });

        // Paginates through all recipe pages
        const nextButton = await page.$("a.pagination__next");

        if (nextButton) {
          await enqueueLinks({
            selector: ".c-pagination-v2__next > a",
            label: "CATEGORY",
          });
        }
        console.log(request.url);
      } else {
        // Queues all categories on the category page
        await page.waitForSelector(".c-card > a");
        await enqueueLinks({
          limit: loadedCategoriesLimit,
          selector: ".c-card > a",
          label: "CATEGORY",
        });
        console.log(request.url);
      }
    } catch (error) {
      console.error("An error occurred:", error.message);
    }
  },
});

await crawler.run(["https://recept.se/kategorier"]);
