import { PlaywrightCrawler } from "crawlee";

const crawler = new PlaywrightCrawler({
  requestHandler: async ({ page, request, enqueueLinks }) => {
    console.log(`Processing: ${request.url}`);

    if (request.label === "RECIPE") {
    } else {
      const viewMoreButtonSelector =
        ".button_button__BUyKl.button_large__EANFK.button_green__8_usM";

      const recipeLinkSelector = "a.list_item_imageWrapper__tK16v";

      let loadMoreCount = 0;

      while (loadMoreCount < 500) {
        try {
          await page.waitForSelector(viewMoreButtonSelector, {
            visible: true,
            timeout: 5000,
          });

          const viewMoreButton = await page.$(viewMoreButtonSelector);
          if (viewMoreButton) {
            await viewMoreButton.click({ force: true });

            console.log(`Clicking "View More" button ${loadMoreCount + 1}`);
            loadMoreCount++;
          } else {
            console.log("No more 'View More' buttons found.");
            break;
          }
        } catch (error) {
          console.error("Error during processing:", error);
          break;
        }
      }
      await page.waitForSelector(recipeLinkSelector, { timeout: 5000 });
      await enqueueLinks({
        selector: recipeLinkSelector,
        label: "RECIPE",
      });
    }
  },
});

await crawler.run(["https://www.koket.se/mat/typ-av-maltid/huvudratter"]);
