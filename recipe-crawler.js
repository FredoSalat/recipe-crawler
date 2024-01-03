import { PlaywrightCrawler, Dataset } from "crawlee";
import { sanitizeText } from "./utilities.js";

const loadedCategoriesLimit = 1;
const loadedRecipeLimit = 1;

const crawler = new PlaywrightCrawler({
  requestHandler: async ({ page, request, enqueueLinks }) => {
    try {
      if (request.label === "DETAIL") {
        const titleElement = await page.locator(".c-recipe__title");

        const imageElements = await page.$$(".c-recipe__image > picture > img");

        if (!imageElements || imageElements.length === 0) {
          throw new Error(`Image not found on this page ${request.url}`);
        }

        const ingredientElements = await page.$$(
          ".recipe-page-body__ingredients"
        );

        const imageElement = imageElements[0];

        if (!titleElement) {
          throw new Error(`Title not found on this page ${request.url}`);
        }

        if (!imageElement) {
          throw new Error(`Image not found on this page ${request.url}`);
        }

        if (!ingredientElements) {
          throw new Error(`Ingredients not found on this page ${request.url}`);
        }

        // recipe name
        const rawTitle = await titleElement.textContent();
        const title = sanitizeText(rawTitle);

        // Extracting the image URL from the 'src' attribute
        const rawImageURL = await imageElement.getAttribute("src");

        const imageURL = rawImageURL.split("?")[0];

        if (!imageURL) {
          throw new Error(`Image URL not found on this page ${request.url}`);
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
              return tdElement.textContent.trim();
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
