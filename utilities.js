// Remove leading newline characters and dashes, whitespace and line breaks

export const sanitizeText = (text) => {
  return text
    .trim()
    .replace(/^\s*–\s*/gm, "")
    .replace(/\s+/g, " ")
    .replace(/^[,\s]+|[,\s]+$/g, "");
};

export const getTitle = async (page, locator, requestURL) => {
  console.log(locator);
  const titleElement = await page.locator(locator);

  if (!titleElement) {
    throw new Error(`Title not found on this page ${requestURL}`);
  }

  const rawTitle = await titleElement.textContent();

  const title = sanitizeText(rawTitle);

  return title;
};

export const getImage = async (page, locator, requestURL) => {
  const imageElements = await page.$$(locator);

  if (!imageElements || imageElements.length === 0) {
    throw new Error(`Images not found on this page ${requestURL}`);
  }

  const imageElement = imageElements[0];

  if (!imageElement) {
    throw new Error(`Image not found on this page ${requestURL}`);
  }

  const rawImageURL = await imageElement.getAttribute("src");

  if (!rawImageURL) {
    throw new Error("Raw Image URL not found on this page");
  }

  const imageURL = rawImageURL.split("?")[0];

  if (!imageURL) {
    throw new Error(`Image URL not found on this page ${requestURL}`);
  }

  return imageURL;
};

export const getIngredients = async (page, locator, requestURL) => {
  const ingredientElements = await page.$$(locator);

  if (!ingredientElements) {
    throw new Error(`Ingredients not found on this page ${requestURL}`);
  }

  // Extracting ingredients
  const ingredients = await Promise.all(
    ingredientElements.map(async (element, index) => {
      const rawPreparation = await ingredientElements[index].textContent();
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

  return ingredients;
};
