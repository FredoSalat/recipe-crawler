import { PlaywrightCrawler, Dataset } from "crawlee";

const crawler = new PlaywrightCrawler({
  requestHandler: async ({ page, request, enqueueLinks }) => {
    //console.log(`Processing: ${request.url}`);

    if (request.label === "DETAIL") {
      console.log(request.url);
      /*   const urlPart = request.url.split("/").slice(-1);

      const manufacturer = urlPart[0].split("-")[0];

      const title = await page.locator(".product-meta h1").textContent();

      const sku = await page
        .locator("span.product-meta__sku-number")
        .textContent();

      const priceElement = page
        .locator("span.price")
        .filter({ hasText: "$" })
        .first();

      const currentPriceString = await priceElement.textContent();

      const rawPrice = currentPriceString.split("$")[1];
      const price = Number(rawPrice.replaceAll(",", ""));

      const inStockElement = page.locator("span.product-form__inventory");

      const inStock = (await inStockElement.count()) > 0;

      const results = {
        url: request.url,
        manufacturer,
        title,
        sku,
        currentPrice: price,
        availableInStock: inStock,
      }; */

      //await Dataset.pushData(results);
    } else if (request.label === "CATEGORY") {
      // We are now on a category page. We can use this to paginate through and enqueue all products, as well as any subsequent pages we find
      await page.waitForSelector(".u-1\\/2 > a");
      await enqueueLinks({ selector: ".u-1\\/2 > a", label: "DETAIL" });

      const nextButton = await page.$("a.pagination__next");

      if (nextButton) {
        await enqueueLinks({
          selector: ".c-pagination-v2__next > a",
          label: "CATEGORY",
        });
      }
      console.log(request.url);
    } else {
      // The program will first only fulfill this condition and thus enqueue all the category pages
      await page.waitForSelector(".c-card > a");
      await enqueueLinks({
        selector: ".c-card > a",
        label: "CATEGORY",
      });
      console.log(request.url);
    }
  },
});

await crawler.run(["https://recept.se/kategorier"]);
