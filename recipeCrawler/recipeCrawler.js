import { extractIngredients, sanitize } from "./recipeUtilities.js";

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

  const ingredients = await extractIngredients(ingredientElements);

  const stringifiedIngredients = JSON.stringify(ingredients);

  return stringifiedIngredients;
};

export const getRecipeCharacteristics = async (page, requestURL) => {
  const characteristicsElements = await page.$$(
    "span.text-1r6.text-ui-greyscale-grey-7.whitespace-nowrap.print\\:text-black"
  );

  if (!characteristicsElements || characteristicsElements.length === 0) {
    throw new Error(`Category not found on this page ${requestURL}`);
  }

  const characteristics = [];
  for (const characteristicElement of characteristicsElements) {
    const characteristic = await characteristicElement.textContent();
    characteristics.push(characteristic);
  }

  return characteristics;
};

export const getInstructions = async (page, requestURL) => {
  const instructionsElements = await page.$$(".mt-0r6.leading-normal");

  if (!instructionsElements || instructionsElements.length === 0) {
    throw new Error(`Instructions not found on this page ${requestURL}`);
  }

  const instructions = [];
  for (const instructionElement of instructionsElements) {
    const instruction = await instructionElement.textContent();
    instructions.push(sanitize(instruction));
  }

  return instructions;
};
