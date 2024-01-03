import { PlaywrightCrawler, Dataset } from "crawlee";
import { sanitizeText } from "../utilities.js";

const loadedCategoriesLimit = 1;
const loadedRecipeLimit = 1;

const crawler = new PlaywrightCrawler({
  requestHandler: async ({ page, request, enqueueLinks }) => {
    try {
      if (request.label === "DETAIL") {
        const titleElement = await page.locator(".c-recipe__title");

        const ingredientElements = await page.$$(
          ".recipe__ingredients > table > tbody > tr > td"
        );

        const ingredientAmountElements = await page.$$(
          ".recipe__ingredients > table > tbody > tr > td > span"
        );

        if (!titleElement) {
          throw new Error(`Title not found on this page ${request.url}`);
        }

        if (!ingredientElements) {
          throw new Error(`Ingredients not found on this page ${request.url}`);
        }

        if (!ingredientAmountElements) {
          throw new Error(
            `Ingredient units not found on this page ${request.url}`
          );
        }
        // recipe name
        const rawTitle = await titleElement.textContent();
        const title = sanitizeText(rawTitle);
        // amount + unit
        const ingredientAmount = await Promise.all(
          ingredientAmountElements.map(async (element) => {
            const rawAmount = await element.textContent();
            return sanitizeText(rawAmount);
          })
        );
        // Ingredient + amount
        const preparation = await Promise.all(
          ingredientElements.map(async (element) => {
            const rawPreparation = await element.textContent();
            return sanitizeText(rawPreparation);
          })
        );

        // Generic ingredient
        const ingredients = await Promise.all(
          ingredientElements.map(async (element) => {
            const ingredientElement = await element.evaluate((tdElement) => {
              // Function to extract text content excluding <span> elements
              const spanElements = tdElement.querySelectorAll("span");
              spanElements.forEach((spanElement) => {
                spanElement.remove();
              });
              return tdElement.textContent;
            });
            return sanitizeText(ingredientElement);
          })
        );

        const recipe = {
          title,
          preparation,
          ingredientAmount,
          ingredients,
        };

        console.log(recipe);
        await Dataset.pushData(recipe);
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
