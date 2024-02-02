import { extractIngredient, sanitize } from "./recipeUtilities.js";

export const getTitle = async (page, requestURL) => {
  const titleElement = await page.locator("h1");

  if (!titleElement) {
    throw new Error(`Title not found on this page ${requestURL}`);
  }

  const rawTitle = await titleElement.textContent();

  const title = sanitize(rawTitle);

  return title;
};

export const getImage = async (page, requestURL) => {
  const imageElements = await page.$$(".relative > img");

  if (!imageElements || imageElements.length === 0) {
    throw new Error(`Images not found on this page ${requestURL}`);
  }

  const imageElement = imageElements[1];

  if (!imageElement) {
    throw new Error(`Image not found on this page ${requestURL}`);
  }

  const rawImageURL = await imageElement.getAttribute("srcset");

  if (!rawImageURL) {
    throw new Error("Raw Image URL not found on this page");
  }

  const imageURL = rawImageURL.split("?")[0];

  if (!imageURL) {
    throw new Error(`Image URL not found on this page ${requestURL}`);
  }

  return imageURL;
};

export const getIngredients = async (page, requestURL) => {
  const ingredientElements = await page.$$(".cts-impression-item > div");

  if (!ingredientElements) {
    throw new Error(`Ingredients not found on this page ${requestURL}`);
  }

  const ingredientsWithEmptyStrings = await Promise.all(
    ingredientElements.map(async (divElement) => {
      const spans = await divElement.$$("span");
      const rawIngredient = await Promise.all(
        spans.map(async (spanElement) => {
          return await spanElement.textContent();
        })
      );
      const unsanitizedIngredient = rawIngredient.join(" ");

      const ingredient = sanitize(unsanitizedIngredient);

      return ingredient;
    })
  );

  const ingredients = ingredientsWithEmptyStrings.filter(
    (ingredient) => ingredient !== ""
  );

  const stringifiedIngredients = JSON.stringify(ingredients);

  return stringifiedIngredients;
};
