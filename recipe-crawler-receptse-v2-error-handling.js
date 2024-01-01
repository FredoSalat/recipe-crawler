import { PlaywrightCrawler, Dataset } from "crawlee";

const categoryLimit = 1;
const recipeLimit = 1;

const crawler = new PlaywrightCrawler({
  requestHandler: async ({ page, request, enqueueLinks }) => {
    try {
      if (request.label === "DETAIL") {
        console.log(request.url);

        const titleElement = await page.locator(".c-recipe__title");

        if (!titleElement) {
          throw new Error("Title not found on the page.");
        }

        const ingredientsElements = await page.$$(
          ".recipe-page-body--secondary-title + tbody tr td"
        );

        if (!ingredientsElements) {
          throw new Error("Ingredients not found on the page.");
        }

        const title = await titleElement.textContent();

        const ingredients = await ingredientsElements.map(
          async (element) => await element.textContent()
        );
        const recipe = {
          title,
          ingredients,
        };

        console.log(recipe);
        // await Dataset.pushData(results);
      } else if (request.label === "CATEGORY") {
        await page.waitForSelector(".u-1\\/2 > a");
        await enqueueLinks({
          limit: recipeLimit,
          selector: ".u-1\\/2 > a",
          label: "DETAIL",
        });

        const nextButton = await page.$("a.pagination__next");

        if (nextButton) {
          await enqueueLinks({
            selector: ".c-pagination-v2__next > a",
            label: "CATEGORY",
          });
        }
        console.log(request.url);
      } else {
        await page.waitForSelector(".c-card > a");
        await enqueueLinks({
          limit: categoryLimit,
          selector: ".c-card > a",
          label: "CATEGORY",
        });
        console.log(request.url);
      }
    } catch (error) {
      if (error instanceof Playwright.errors.TimeoutError) {
        console.error("Timeout error: The operation timed out.");
      } else if (error instanceof Playwright.errors.ElementHandleError) {
        console.error("Element handle error:", error.message);
      } else {
        console.error("An unexpected error occurred:", error.message);
      }
    }
  },
});

await crawler.run(["https://recept.se/kategorier"]);
