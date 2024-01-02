import { PlaywrightCrawler, Dataset } from "crawlee";

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

        const ingredientsElements = await page.$$(
          ".recipe__ingredients > table > tbody > tr > td"
        );

        if (!ingredientsElements) {
          throw new Error(`Ingredients not found on this page ${request.url}`);
        }

        const title = await titleElement.textContent();

        const ingredients = await Promise.all(
          ingredientsElements.map(async (element) => {
            const rawText = await element.textContent();
            // Remove leading newline characters and dashes
            const cleanedText = rawText.replace(/^\s*–\s*/gm, "");
            return cleanedText;
          })
        );

        const recipe = {
          title,
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
