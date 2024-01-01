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
          ".recipe__ingredients > table > tbody > tr > td"
        );

        const ingredient = await Promise.all(
          ingredientsElements.map(async (element) => {
            return element.textContent();
          })
        );
        const title = await titleElement.textContent();

        const recipe = {
          title,
          ingredient,
        };

        //console.log(recipe);
        await Dataset.pushData(recipe);
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
      console.error("An unexpected error occurred:", error.message);
    }
  },
});

await crawler.run(["https://recept.se/kategorier"]);
