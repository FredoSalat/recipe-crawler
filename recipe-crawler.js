import { PlaywrightCrawler, Dataset } from "crawlee";
import { textClean } from "./utilities.js";

const loadedCategoriesLimit = 1;
const loadedRecipeLimit = 1;

const crawler = new PlaywrightCrawler({
  requestHandler: async ({ page, request, enqueueLinks }) => {
    try {
      if (request.label === "DETAIL") {
        const titleElement = await page.locator(".c-recipe__title");

        if (!titleElement) {
          throw new Error(`Title not found on this page ${request.url}`);
        }

        const ingredientElements = await page.$$(
          ".recipe__ingredients > table > tbody > tr > td"
        );

        if (!ingredientElements) {
          throw new Error(`Ingredients not found on this page ${request.url}`);
        }

        const ingredientUnitElements = await page.$$(
          ".recipe__ingredients > table > tbody > tr > td > span"
        );

        const ingredientUnit = await Promise.all(
          ingredientUnitElements.map(async (element) => {
            const rawText = await element.textContent();
            return rawText;
          })
        );

        const rawTitle = await titleElement.textContent();
        const title = textClean(rawTitle);

        const preparation = await Promise.all(
          ingredientElements.map(async (element) => {
            const rawText = await element.textContent();
            const cleanedText = textClean(rawText);
            return cleanedText;
          })
        );

        const ingredients = await Promise.all(
          ingredientElements.map(async (element) => {
            const textContent = await element.evaluate((tdElement) => {
              // Function to extract text content excluding <span> elements
              const spanElements = tdElement.querySelectorAll("span");
              spanElements.forEach((spanElement) => {
                spanElement.remove();
              });
              return tdElement.textContent.trim();
            });
            return textContent;
          })
        );

        const recipe = {
          title,
          preparation,
          ingredientUnit,
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
