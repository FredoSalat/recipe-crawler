import { PlaywrightCrawler, Dataset } from "crawlee";

const categoryLimit = 1;
const recipeLimit = 1;

const crawler = new PlaywrightCrawler({
  requestHandler: async ({ page, request, enqueueLinks }) => {
    if (request.label === "DETAIL") {
      console.log(request.url);

      const title = await page.locator(".c-recipe__title").textContent();

      const ingredients = await page
        .locator(".cts-impression-group > td")
        .textContent();

      const recipe = {
        title,
        ingredients,
      };

      console.log(recipe);
      //await Dataset.pushData(results);
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
  },
});

await crawler.run(["https://recept.se/kategorier"]);
