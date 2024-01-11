import { PlaywrightCrawler } from "crawlee";
import sqlite3 from "sqlite3";
import { sanitizeText } from "./utilities.js";

const db = new sqlite3.Database("recipe.db");

const loadedCategoriesLimit = 200;
const loadedRecipeLimit = 2000;

const crawler = new PlaywrightCrawler({
  requestHandler: async ({ page, request, enqueueLinks }) => {
    try {
      if (request.label === "DETAIL") {
        // Title
        const titleElement = await page.locator(".c-recipe__title");

        if (!titleElement) {
          throw new Error(`Title not found on this page ${request.url}`);
        }

        const rawTitle = await titleElement.textContent();

        const title = sanitizeText(rawTitle);

        // Image

        const imageElements = await page.$$(".c-recipe__image > picture > img");

        if (!imageElements || imageElements.length === 0) {
          throw new Error(`Images not found on this page ${request.url}`);
        }

        const imageElement = imageElements[0];

        if (!imageElement) {
          throw new Error(`Image not found on this page ${request.url}`);
        }

        const rawImageURL = await imageElement.getAttribute("src");

        if (!rawImageURL) {
          throw new Error("Raw Image URL not found on this page");
        }

        const imageURL = rawImageURL.split("?")[0];

        if (!imageURL) {
          throw new Error(`Image URL not found on this page ${request.url}`);
        }

        // Ingredients

        const ingredientElements = await page.$$(
          ".recipe-page-body__ingredients"
        );

        if (!ingredientElements) {
          throw new Error(`Ingredients not found on this page ${request.url}`);
        }

        // Extracting ingredients
        const ingredients = await Promise.all(
          ingredientElements.map(async (element, index) => {
            const rawPreparation = await ingredientElements[
              index
            ].textContent();
            const preparation = sanitizeText(rawPreparation);

            // Extracting ingredient text content excluding <span> elements
            const ingredientElement = await element.evaluate((tdElement) => {
              const spanElements = tdElement.querySelectorAll("span");
              spanElements.forEach((spanElement) => {
                spanElement.remove();
              });
              return tdElement.textContent;
            });

            const ingredient = sanitizeText(ingredientElement);

            return {
              ingredient,
              preparation,
            };
          })
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
