import { PlaywrightCrawler } from "crawlee";
import sqlite3 from "sqlite3";
import {
  getImage,
  getIngredients,
  getTitle,
  sanitizeText,
} from "./utilities.js";

const db = new sqlite3.Database("recipe.db");

const loadedCategoriesLimit = 1;
const loadedRecipeLimit = 2;

const crawler = new PlaywrightCrawler({
  requestHandler: async ({ page, request, enqueueLinks }) => {
    try {
      if (request.label === "DETAIL") {
        const title = await getTitle(page, ".c-recipe__title", request.url);

        const imageURL = getImage(
          page,
          ".c-recipe__image > picture > img",
          request.url
        );

        const ingredients = getIngredients(
          page,
          ".recipe-page-body__ingredients",
          request.url
        );

        const recipe = {
          title,
          imageURL,
          ingredients,
        };

        const ingredientsString = JSON.stringify(recipe.ingredients);

        await new Promise((resolve, reject) => {
          db.run(
            `
            CREATE TABLE IF NOT EXISTS recipe (
              title TEXT,
              imageURL TEXT,
              ingredients TEXT
            )`,
            (err) => {
              if (err) {
                console.error("Error creating table:", err.message);
                reject(err);
              } else {
                console.log("Table 'recipe' created successfully");
                resolve();
              }
            }
          );
        });

        const stmt = db.prepare(
          "INSERT INTO recipe (title, imageURL, ingredients) VALUES (?, ?, ?)"
        );

        stmt.run(recipe.title, recipe.imageURL, ingredientsString);

        stmt.finalize();
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
